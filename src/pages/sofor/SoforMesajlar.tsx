import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { Send, User, Check, CheckCheck, CheckCircle2, X, DollarSign, Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Message {
  id: number;
  sender: "customer" | "driver";
  text: string;
  time: string;
  read: boolean;
}

interface Conversation {
  id: number;
  customerId: string | null;
  driverId: string | null;
  listingId: number | null;
  lastMessage: string | null;
  time: string | null;
  customer_unread_count: number;
  driver_unread_count: number;
  route: string | null;
  customerName: string; // Joined from users table
  customer_approved: boolean;
  driver_approved: boolean;
  lastMessageSender: string | null; // 'customer' or 'driver'
  customerPhone?: string;
}


const SoforMesajlar = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedConversationData, setSelectedConversationData] = useState<Conversation | null>(null);
  const [listingPrice, setListingPrice] = useState<string | null>(null);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [bothApproved, setBothApproved] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState("");

  // Get conversationId from URL params (for navigation from "İletişim Kur" button)
  useEffect(() => {
    const conversationIdParam = searchParams.get('conversationId');
    if (conversationIdParam) {
      const convId = parseInt(conversationIdParam, 10);
      if (!isNaN(convId)) {
        setSelectedConvo(convId);
      }
    }
  }, [searchParams]);

  // Fetch conversations for the logged-in driver
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.id || typeof user.id !== 'string') {
        setLoading(false);
        return;
      }

      try {
        // Fetch conversations where driverId matches current user
        const { data: convsData, error: convsError } = await supabase
          .from('conversations')
          .select('*, customer_confirmed, driver_confirmed, customer_unread_count, driver_unread_count')
          .eq('driverId', user.id)
          .order('updatedAt', { ascending: false });

        if (convsError) {
          console.error('Error fetching conversations:', convsError);
          toast.error('Görüşmeler yüklenirken bir hata oluştu');
          setLoading(false);
          return;
        }

        if (!convsData || convsData.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        // Fetch customer names and last message sender for each conversation
        const conversationsWithNames = await Promise.all(
          convsData.map(async (conv) => {
            if (!conv.customerId) {
              return {
                ...conv,
                customerName: 'Bilinmeyen Kullanıcı',
                lastMessageSender: null
              };
            }

            const [customerDataResult, lastMessageResult] = await Promise.all([
              supabase
                .from('users')
                .select('name, phone')
                .eq('id', conv.customerId)
                .maybeSingle(),
              supabase
                .from('messages')
                .select('sender')
                .eq('conversationId', conv.id)
                .order('createdAt', { ascending: false })
                .limit(1)
                .maybeSingle()
            ]);

            if (customerDataResult.error) {
              console.error('Error fetching customer name:', customerDataResult.error);
            }

            return {
              ...conv,
              customerName: customerDataResult.data?.name || 'Bilinmeyen Kullanıcı',
              customerPhone: customerDataResult.data?.phone,
              customer_approved: conv.customer_confirmed || false, // Map to old field for compatibility
              driver_approved: conv.driver_confirmed || false, // Map to old field for compatibility
              customer_unread_count: conv.customer_unread_count || 0,
              driver_unread_count: conv.driver_unread_count || 0,
              lastMessageSender: lastMessageResult.data?.sender || null
            };
          })
        );

        setConversations(conversationsWithNames);

        // If no conversation is selected but we have conversations, select the first one
        if (!selectedConvo && conversationsWithNames.length > 0) {
          setSelectedConvo(conversationsWithNames[0].id);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Görüşmeler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  // Fetch messages for selected conversation and reset unread count
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConvo) {
        setMessages([]);
        setListingPrice(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversationId', selectedConvo)
          .order('createdAt', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          toast.error('Mesajlar yüklenirken bir hata oluştu');
          return;
        }

        // Map database messages to component format
        const formattedMessages: Message[] = (data || []).map((msg) => ({
          id: msg.id,
          sender: msg.sender === 'customer' ? 'customer' : 'driver',
          text: msg.text,
          time: msg.time,
          read: msg.read
        }));

        setMessages(formattedMessages);

        // Find and set selected conversation data
        const selectedConv = conversations.find(c => c.id === selectedConvo);
        if (selectedConv) {
          setSelectedConversationData(selectedConv);
          // Fetch current confirmation status
          const { data: convStatus } = await supabase
            .from('conversations')
            .select('customer_confirmed, driver_confirmed')
            .eq('id', selectedConvo)
            .single();

          setIsApproved(convStatus?.driver_confirmed || false);
          setBothApproved(convStatus?.customer_confirmed && convStatus?.driver_confirmed);

          // Fetch listing price if listingId exists
          if (selectedConv.listingId) {
            const { data: listingData, error: listingError } = await supabase
              .from('listings')
              .select('price')
              .eq('id', selectedConv.listingId)
              .single();

            if (!listingError && listingData) {
              setListingPrice(listingData.price);
            }
          }

          // Reset driver_unread_count when conversation is opened (driver is viewing)
          if (selectedConv.driver_unread_count > 0) {
            const { error: updateError } = await supabase
              .from('conversations')
              .update({ driver_unread_count: 0 })
              .eq('id', selectedConvo);

            if (!updateError) {
              // Update local state
              setConversations(prev => prev.map(conv =>
                conv.id === selectedConvo
                  ? { ...conv, driver_unread_count: 0 }
                  : conv
              ));
              setSelectedConversationData(prev => prev ? { ...prev, driver_unread_count: 0 } : null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Mesajlar yüklenirken bir hata oluştu');
      }
    };

    fetchMessages();
  }, [selectedConvo, conversations]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvo || !user?.id || sending) {
      return;
    }

    setSending(true);
    try {
      // Get current time in HH:mm format
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Insert message (sender is 'driver' for driver role)
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversationId: selectedConvo,
          sender: 'driver',
          text: newMessage.trim(),
          time: timeString,
          read: false
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        toast.error('Mesaj gönderilirken bir hata oluştu');
        setSending(false);
        return;
      }

      // Update conversation's lastMessage, time, and updatedAt
      // When driver sends message, increment customer_unread_count (customer is the receiver)
      // DO NOT touch driver_unread_count (driver is the sender)
      const { data: currentConv, error: fetchError } = await supabase
        .from('conversations')
        .select('customer_unread_count')
        .eq('id', selectedConvo)
        .single();

      const newCustomerUnreadCount = (currentConv?.customer_unread_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          lastMessage: newMessage.trim(),
          time: timeString,
          updatedAt: new Date().toISOString(),
          customer_unread_count: newCustomerUnreadCount
        })
        .eq('id', selectedConvo);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
        // Don't show error to user, message was sent successfully
      }

      // Add new message to local state
      const newMsg: Message = {
        id: messageData.id,
        sender: 'driver',
        text: newMessage.trim(),
        time: timeString,
        read: false
      };

      setMessages([...messages, newMsg]);
      setNewMessage("");

      // Update conversation in list
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConvo
          ? { ...conv, lastMessage: newMessage.trim(), time: timeString }
          : conv
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Mesaj gönderilirken bir hata oluştu');
    } finally {
      setSending(false);
    }
  };

  // Determine if message is from current user (driver)
  const isMyMessage = (sender: "customer" | "driver") => {
    return sender === 'driver';
  };

  if (loading) {
    return (
      <DashboardLayout role="sofor">
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="text-muted-foreground">Yükleniyor...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="sofor">
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-2xl md:text-3xl font-bold">Mesajlar</h1>
          <p className="text-muted-foreground">Müşterilerle iletişim kurun</p>
        </div>

        <div className="flex-1 grid lg:grid-cols-3 gap-4 min-h-0 overflow-hidden">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col h-full min-h-0">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg">Görüşmeler</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
              {conversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Henüz görüşme yok
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${selectedConvo === convo.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{convo.customerName}</span>
                          <span className="text-xs text-muted-foreground">{convo.time || ''}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessage || 'Henüz mesaj yok'}</p>
                        {convo.route && (
                          <p className="text-xs text-primary mt-1">{convo.route}</p>
                        )}
                      </div>
                      {/* Show badge only if driver_unread_count > 0 (messages from customer that driver hasn't read) */}
                      {convo.driver_unread_count > 0 && (
                        <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                          {convo.driver_unread_count}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col h-full min-h-0">
            {selectedConversationData ? (
              <>
                <CardHeader className="pb-3 border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{selectedConversationData.customerName}</CardTitle>
                        {selectedConversationData.route && (
                          <p className="text-sm text-muted-foreground">{selectedConversationData.route}</p>
                        )}
                      </div>
                    </div>
                    {listingPrice && (
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-xl font-bold text-orange-600 leading-none">
                          {listingPrice}
                        </p>
                        <p className="text-sm text-slate-600 leading-none">İlan Başlangıç Fiyatı</p>
                      </div>

                    )}
                    {selectedConversationData.customerPhone && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (selectedConversationData.customerPhone) {
                            navigator.clipboard.writeText(selectedConversationData.customerPhone);
                            toast.success(`Numara kopyalandı: ${selectedConversationData.customerPhone}`);
                          }
                        }}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Henüz mesaj yok. İlk mesajı siz gönderin.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = isMyMessage(msg.sender);
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] ${isMe ? "order-1" : ""}`}>
                            <div className={`px-4 py-2 rounded-2xl ${isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                              }`}>
                              {msg.text}
                            </div>
                            <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isMe ? "justify-end" : ""
                              }`}>
                              <span>{msg.time}</span>
                              {isMe && (
                                msg.read ? <CheckCheck className="w-3 h-3 text-primary" /> : <Check className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>

                {/* Approval Status & Action Buttons */}
                <div className="px-4 pt-3 pb-2 border-t border-border/50 flex-shrink-0">
                  {bothApproved ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm text-center">
                      ✅ <strong>Anlaşma sağlandı!</strong> İşlem Aktif İşlemler sekmesine taşındı.
                    </div>
                  ) : isApproved ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm text-center">
                      <strong>Anlaşma onayınız alındı, karşı tarafın fiyat girmesi bekleniyor...</strong>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setShowConfirmApprove(true)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Anlaşmayı Onayla
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setShowConfirmCancel(true)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Konuşmayı İptal Et
                      </Button>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t flex-shrink-0">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Mesajınızı yazın..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !sending && handleSend()}
                      disabled={sending}
                    />
                    <Button variant="hero" size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Bir görüşme seçin
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Confirm Approve Dialog */}
      <AlertDialog open={showConfirmApprove} onOpenChange={setShowConfirmApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anlaşmayı Onayla</AlertDialogTitle>
            <AlertDialogDescription>
              Anlaşılan fiyatı girin ve anlaşmayı onaylayın. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agreedPrice">Anlaşılan Fiyat (₺)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="agreedPrice"
                  type="number"
                  placeholder="Örn: 5000"
                  className="pl-10"
                  value={agreedPrice}
                  onChange={(e) => setAgreedPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAgreedPrice("")}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selectedConvo) {
                  setShowConfirmApprove(false);
                  setAgreedPrice("");
                  return;
                }

                if (!agreedPrice.trim()) {
                  toast.error('Lütfen anlaşılan fiyatı girin');
                  return;
                }

                // Parse price to number to avoid 400 errors
                const priceNumber = parseFloat(agreedPrice.trim());
                if (isNaN(priceNumber) || priceNumber <= 0) {
                  toast.error('Lütfen geçerli bir fiyat girin');
                  return;
                }

                try {
                  // Update driver_confirmed and driver_price (as number)
                  const { error: updateError } = await supabase
                    .from('conversations')
                    .update({
                      driver_confirmed: true,
                      driver_price: priceNumber // Store as number in DB
                    })
                    .eq('id', selectedConvo);

                  if (updateError) {
                    console.error('Error approving:', updateError);
                    toast.error('Onay verilirken bir hata oluştu');
                    setShowConfirmApprove(false);
                    setAgreedPrice("");
                    return;
                  }

                  // Check if both parties confirmed and compare prices
                  const { data: convData, error: convError } = await supabase
                    .from('conversations')
                    .select('customer_confirmed, driver_confirmed, customer_price, driver_price, listingId, customerId, driverId')
                    .eq('id', selectedConvo)
                    .single();

                  if (!convError && convData) {
                    // If this is the first approval, show waiting message
                    if (!convData.customer_confirmed) {
                      setIsApproved(true);
                      setSelectedConversationData(prev => prev ? { ...prev, driver_approved: true } : null);
                      setConversations(prev => prev.map(conv =>
                        conv.id === selectedConvo
                          ? { ...conv, driver_approved: true }
                          : conv
                      ));
                      toast.success('Onayınız alındı, karşı tarafın aynı fiyatı girmesi bekleniyor...');
                      setShowConfirmApprove(false);
                      setAgreedPrice("");
                      return;
                    }

                    // If both confirmed, compare prices
                    if (convData.customer_confirmed && convData.driver_confirmed) {
                      // Convert prices to numbers (handle both number and string types)
                      const customerPrice = typeof convData.customer_price === 'number'
                        ? convData.customer_price
                        : parseFloat(String(convData.customer_price || '0').replace(/[₺,\s]/g, '')) || 0;
                      const driverPrice = typeof convData.driver_price === 'number'
                        ? convData.driver_price
                        : parseFloat(String(convData.driver_price || '0').replace(/[₺,\s]/g, '')) || 0;

                      // Check if prices match
                      if (Math.abs(customerPrice - driverPrice) < 0.01) {
                        // Prices match - create order
                        setBothApproved(true);

                        // Fetch listing data
                        if (convData.listingId && convData.customerId && convData.driverId) {
                          const { data: listingData, error: listingError } = await supabase
                            .from('listings')
                            .select('from, to, date, vehicleType, price')
                            .eq('id', convData.listingId)
                            .single();

                          if (!listingError && listingData) {
                            // Validate all required fields before insert
                            if (!listingData.from || !listingData.to || !listingData.date) {
                              console.error('Missing required listing fields:', listingData);
                              toast.error('İlan bilgileri eksik. Lütfen daha sonra tekrar deneyin.');
                              return;
                            }

                            // Use confirmed price (convert to string for final_price field)
                            const confirmedPrice = String(driverPrice);

                            // Create order with final_price
                            const { error: orderError } = await supabase
                              .from('orders')
                              .insert({
                                customerId: convData.customerId,
                                driverId: convData.driverId,
                                listingId: convData.listingId,
                                from: listingData.from,
                                to: listingData.to,
                                date: listingData.date,
                                vehicleType: listingData.vehicleType || null,
                                price: listingPrice || listingData.price || '0',
                                final_price: confirmedPrice,
                                status: 'Hazırlanıyor',
                                progress: 20
                              });

                            if (!orderError) {
                              // Update listing status
                              await supabase
                                .from('listings')
                                .update({ status: 'Beklemede' })
                                .eq('id', convData.listingId);

                              toast.success('Anlaşma sağlandı! İşlem Aktif İşlemler sekmesine taşındı.');

                              // Trigger custom event to notify other tabs/pages
                              window.dispatchEvent(new Event('orderCreated'));
                              // Also trigger storage event for cross-tab communication
                              localStorage.setItem('orderUpdated', Date.now().toString());
                              window.dispatchEvent(new Event('storage'));
                            } else {
                              console.error('Error creating order:', orderError);
                              toast.error('Sipariş oluşturulurken bir hata oluştu');
                            }
                          }
                        }
                      } else {
                        // Prices don't match - reset both confirmations and prices
                        toast.error(`Girdiğiniz tutarlar (Müşteri: ${customerPrice.toLocaleString('tr-TR')}₺, Şoför: ${driverPrice.toLocaleString('tr-TR')}₺) uyuşmuyor`);
                        setIsApproved(false);
                        setSelectedConversationData(prev => prev ? { ...prev, driver_approved: false } : null);
                        setConversations(prev => prev.map(conv =>
                          conv.id === selectedConvo
                            ? { ...conv, driver_approved: false }
                            : conv
                        ));
                        // Reset both parties' confirmations and prices
                        await supabase
                          .from('conversations')
                          .update({
                            customer_confirmed: false,
                            driver_confirmed: false,
                            customer_price: null,
                            driver_price: null
                          })
                          .eq('id', selectedConvo);
                      }
                    } else {
                      // First approval - already handled above
                      setIsApproved(true);
                      setSelectedConversationData(prev => prev ? { ...prev, driver_approved: true } : null);
                      setConversations(prev => prev.map(conv =>
                        conv.id === selectedConvo
                          ? { ...conv, driver_approved: true }
                          : conv
                      ));
                    }
                  }

                  setShowConfirmApprove(false);
                  setAgreedPrice("");
                } catch (error) {
                  console.error('Error in approve:', error);
                  toast.error('Bir hata oluştu');
                  setShowConfirmApprove(false);
                  setAgreedPrice("");
                }
              }}
              className="bg-green-600 hover:bg-green-700"
              disabled={!agreedPrice.trim()}
            >
              Onayla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Cancel Dialog */}
      <AlertDialog open={showConfirmCancel} onOpenChange={setShowConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konuşmayı İptal Et</AlertDialogTitle>
            <AlertDialogDescription>
              Bu konuşmayı iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // TODO: Implement cancel logic
                setShowConfirmCancel(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              İptal Et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout >
  );
};

export default SoforMesajlar;
