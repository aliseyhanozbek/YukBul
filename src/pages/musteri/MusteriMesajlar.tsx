import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Search, Send, User, Star, Truck, MapPin, MoreVertical,
  Phone, CheckCheck, Check, CheckCircle2, X, DollarSign
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "react-router-dom";
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
  online: boolean;
  route: string | null;
  driverName: string; // Joined from users table
  driverRating: number; // Joined from users table
  customer_approved: boolean;
  driver_approved: boolean;
  lastMessageSender: string | null; // 'customer' or 'driver'
  driverPhone?: string;
}


const MusteriMesajlar = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
        // Find and select the conversation
        const foundConv = conversations.find(c => c.id === convId);
        if (foundConv) {
          setSelectedConversation(foundConv);
        }
      }
    }
  }, [searchParams, conversations]);

  // Fetch conversations for the logged-in customer
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.id || typeof user.id !== 'string') {
        setLoading(false);
        return;
      }

      try {
        // Fetch conversations where customerId matches current user
        const { data: convsData, error: convsError } = await supabase
          .from('conversations')
          .select('*, customer_confirmed, driver_confirmed, customer_unread_count, driver_unread_count')
          .eq('customerId', user.id)
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

        // Fetch driver names, ratings, and last message sender for each conversation
        const conversationsWithNames = await Promise.all(
          convsData.map(async (conv) => {
            if (!conv.driverId) {
              return {
                ...conv,
                driverName: 'Bilinmeyen Şoför',
                driverRating: 0,
                lastMessageSender: null
              };
            }

            const [driverDataResult, lastMessageResult, reviewsResult] = await Promise.all([
              supabase
                .from('users')
                .select('name, phone')
                .eq('id', conv.driverId)
                .maybeSingle(),
              supabase
                .from('messages')
                .select('sender')
                .eq('conversationId', conv.id)
                .order('createdAt', { ascending: false })
                .limit(1)
                .maybeSingle(),
              supabase
                .from('reviews')
                .select('rating')
                .eq('driverId', conv.driverId)
            ]);

            if (driverDataResult.error) {
              console.error('Error fetching driver name:', driverDataResult.error);
            }

            return {
              ...conv,
              driverName: driverDataResult.data?.name || 'Bilinmeyen Şoför',
              driverRating: reviewsResult.data && reviewsResult.data.length > 0
                ? reviewsResult.data.reduce((acc, curr) => acc + curr.rating, 0) / reviewsResult.data.length
                : 0,
              driverPhone: driverDataResult.data?.phone,
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
        if (!selectedConversation && conversationsWithNames.length > 0) {
          setSelectedConversation(conversationsWithNames[0]);
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
      if (!selectedConversation) {
        setMessages([]);
        setListingPrice(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversationId', selectedConversation.id)
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
        // Fetch current confirmation status
        const { data: convStatus } = await supabase
          .from('conversations')
          .select('customer_confirmed, driver_confirmed')
          .eq('id', selectedConversation.id)
          .single();

        setIsApproved(convStatus?.customer_confirmed || false);
        setBothApproved(convStatus?.customer_confirmed && convStatus?.driver_confirmed);

        // Fetch listing price if listingId exists
        if (selectedConversation.listingId) {
          const { data: listingData, error: listingError } = await supabase
            .from('listings')
            .select('price')
            .eq('id', selectedConversation.listingId)
            .single();

          if (!listingError && listingData) {
            setListingPrice(listingData.price);
          }
        }

        // Reset customer_unread_count when conversation is opened (customer is viewing)
        if (selectedConversation.customer_unread_count > 0) {
          const { error: updateError } = await supabase
            .from('conversations')
            .update({ customer_unread_count: 0 })
            .eq('id', selectedConversation.id);

          if (!updateError) {
            // Update local state
            setConversations(prev => prev.map(conv =>
              conv.id === selectedConversation.id
                ? { ...conv, customer_unread_count: 0 }
                : conv
            ));
            setSelectedConversation(prev => prev ? { ...prev, customer_unread_count: 0 } : null);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Mesajlar yüklenirken bir hata oluştu');
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConversation || !user?.id || sending) {
      return;
    }

    setSending(true);
    try {
      // Get current time in HH:mm format
      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Insert message (sender is 'customer' for customer role)
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversationId: selectedConversation.id,
          sender: 'customer',
          text: messageInput.trim(),
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
      // When customer sends message, increment driver_unread_count (driver is the receiver)
      // DO NOT touch customer_unread_count (customer is the sender)
      const { data: currentConv, error: fetchError } = await supabase
        .from('conversations')
        .select('driver_unread_count')
        .eq('id', selectedConversation.id)
        .single();

      const newDriverUnreadCount = (currentConv?.driver_unread_count || 0) + 1;

      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          lastMessage: messageInput.trim(),
          time: timeString,
          updatedAt: new Date().toISOString(),
          driver_unread_count: newDriverUnreadCount
        })
        .eq('id', selectedConversation.id);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
        // Don't show error to user, message was sent successfully
      }

      // Add new message to local state
      const newMsg: Message = {
        id: messageData.id,
        sender: 'customer',
        text: messageInput.trim(),
        time: timeString,
        read: false
      };

      setMessages([...messages, newMsg]);
      setMessageInput("");

      // Update conversation in list
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: messageInput.trim(), time: timeString }
          : conv
      ));

      // Update selected conversation
      setSelectedConversation(prev => prev ? {
        ...prev,
        lastMessage: messageInput.trim(),
        time: timeString
      } : null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Mesaj gönderilirken bir hata oluştu');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.route && conv.route.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Determine if message is from current user (customer)
  const isMyMessage = (sender: "customer" | "driver") => {
    return sender === 'customer';
  };

  if (loading) {
    return (
      <DashboardLayout role="musteri">
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="text-muted-foreground">Yükleniyor...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="musteri">
      <div className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold mb-3">Mesajlar</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Şoför veya güzergah ara..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz görüşme yok'}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border/50",
                      selectedConversation?.id === conv.id
                        ? "bg-secondary/10"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{conv.driverName}</span>
                        <span className="text-xs text-muted-foreground">{conv.time || ''}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span>{conv.driverRating.toFixed(1)}</span>
                        {conv.route && (
                          <>
                            <span className="mx-1">•</span>
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{conv.route}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || 'Henüz mesaj yok'}</p>
                    </div>
                    {/* Show badge only if customer_unread_count > 0 (messages from driver that customer hasn't read) */}
                    {conv.customer_unread_count > 0 && (
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                        {conv.customer_unread_count}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      {selectedConversation.online && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {selectedConversation.driverName}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {selectedConversation.driverRating.toFixed(1)}
                        </div>
                      </div>
                      {selectedConversation.route && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {selectedConversation.route}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {listingPrice && (
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-xl font-bold text-orange-600 leading-none">
                          {listingPrice}
                        </p>
                        <p className="text-sm text-slate-600 leading-none">İlan Başlangıç Fiyatı</p>
                      </div>
                    )}
                    {selectedConversation.driverPhone && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (selectedConversation.driverPhone) {
                            navigator.clipboard.writeText(selectedConversation.driverPhone);
                            toast.success(`Müşteri telefon numarası da kopyalandı.`);
                            // Also copy driver phone number as requested
                            navigator.clipboard.writeText(selectedConversation.driverPhone);
                            toast.success(`Numara kopyalandı: ${selectedConversation.driverPhone}`);
                          }
                        }}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Henüz mesaj yok. İlk mesajı siz gönderin.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMe = isMyMessage(message.sender);
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            isMe ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] lg:max-w-[60%] rounded-2xl px-4 py-2.5",
                              isMe
                                ? "bg-secondary text-secondary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            )}
                          >
                            <p className="text-sm">{message.text}</p>
                            <div className={cn(
                              "flex items-center justify-end gap-1 mt-1",
                              isMe ? "text-secondary-foreground/70" : "text-muted-foreground"
                            )}>
                              <span className="text-xs">{message.time}</span>
                              {isMe && (
                                message.read ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Approval Status & Action Buttons */}
                <div className="px-4 pt-3 pb-2 border-t border-border/50">
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

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Mesajınızı yazın..."
                      className="flex-1"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !sending && handleSend()}
                      disabled={sending}
                    />
                    <Button variant="secondary" size="icon" onClick={handleSend} disabled={sending || !messageInput.trim()}>
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
                if (!selectedConversation) {
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
                  // Update customer_confirmed and customer_price (as number)
                  const { error: updateError } = await supabase
                    .from('conversations')
                    .update({
                      customer_confirmed: true,
                      customer_price: priceNumber // Store as number in DB
                    })
                    .eq('id', selectedConversation.id);

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
                    .eq('id', selectedConversation.id)
                    .single();

                  if (!convError && convData) {
                    // If this is the first approval, show waiting message
                    if (!convData.driver_confirmed) {
                      setIsApproved(true);
                      setSelectedConversation(prev => prev ? { ...prev, customer_approved: true } : null);
                      setConversations(prev => prev.map(conv =>
                        conv.id === selectedConversation.id
                          ? { ...conv, customer_approved: true }
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
                            const confirmedPrice = String(customerPrice);

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
                        setSelectedConversation(prev => prev ? { ...prev, customer_approved: false } : null);
                        setConversations(prev => prev.map(conv =>
                          conv.id === selectedConversation.id
                            ? { ...conv, customer_approved: false }
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
                          .eq('id', selectedConversation.id);
                      }
                    } else {
                      // First approval - already handled above
                      setIsApproved(true);
                      setSelectedConversation(prev => prev ? { ...prev, customer_approved: true } : null);
                      setConversations(prev => prev.map(conv =>
                        conv.id === selectedConversation.id
                          ? { ...conv, customer_approved: true }
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
    </DashboardLayout>
  );
};

export default MusteriMesajlar;
