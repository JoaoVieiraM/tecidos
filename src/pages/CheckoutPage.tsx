
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, MapPin, User, Package, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';

interface CreatePreferencePayload {
  order_id: string;
  items: {
    title: string;
    quantity: number;
    unit_price: number;
  }[];
  payer: {
    name?: string;
    email: string;
  };
}

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  // Get data from navigation state
  const {
    cartItems = [],
    selectedShipping = null,
    subtotal = 0,
    shippingCost = 0,
    total = 0
  } = location.state || {};

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Não é possível finalizar uma compra sem itens.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          status: 'pending',
          total_amount: total,
          shipping_cost: shippingCost,
          customer_name: customerData.name,
          customer_email: customerData.email,
          shipping_address: {
            address: customerData.address,
            city: customerData.city,
            state: customerData.state,
            zipCode: customerData.zipCode,
            phone: customerData.phone
          },
          payment_info: {
            cardLast4: customerData.cardNumber.slice(-4),
            cardName: customerData.cardName
          }
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }
      interface OrderItem{
        order_id: string;
        product_id: string;
        product_name: string;
        product_price: number;
        quantity: number;
        subtotal: number;
      }

      // Create order items
      const orderItems:OrderItem[] = cartItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }));

      const payload: CreatePreferencePayload = {
        order_id: order.id,
        items: orderItems.map((item) => ({
          title: item.product_name,
          quantity: item.quantity,
          unit_price: item.product_price
        })),
        payer: {
          name: customerData.name,
          email: customerData.email
        }
      }

      const {data, error} = await supabase.functions.invoke('create-payment-preference', {
        body: payload
      })
      console.log(data)
      console.log(error)
      // const jsonData = JSON.parse(data)


      if(error){
        throw error
      }

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      // Send confirmation email
      // try {
      //   const { error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
      //     body: {
      //       orderId: order.id,
      //       customerEmail: customerData.email,
      //       customerName: customerData.name
      //     }
      //   });

      //   if (emailError) {
      //     console.error('Error sending confirmation email:', emailError);
      //     // Don't throw error for email - order was still created successfully
      //   }
      // } catch (emailError) {
      //   console.error('Error sending confirmation email:', emailError);
      //   // Continue with success flow even if email fails
      // }

      // Clear cart
      await clearCart();

      toast({
        title: "Pedido realizado com sucesso!",
        description: `Seu pedido #${order.id.slice(-8).toUpperCase()} foi criado. Você receberá um email de confirmação em breve.`,
      });

      // Redirect to success page or orders page
      window.location.href = data.checkoutUrl;
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erro ao processar pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect to cart if no items
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto bg-white border-petrol-200">
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-petrol-600 mb-4" />
              <h2 className="text-xl font-semibold text-petrol-900 mb-2">Carrinho Vazio</h2>
              <p className="text-antracite-600 mb-4">Adicione itens ao carrinho antes de finalizar a compra.</p>
              <Button onClick={() => navigate('/produtos')} className="bg-petrol-600 hover:bg-petrol-700">
                Ver Produtos
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-petrol-900 mb-8 text-center">Finalizar Pedido</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Customer Information */}
              <div className="lg:col-span-2">
                <Card className="mb-6 bg-white border-petrol-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-petrol-900">
                      <User className="h-5 w-5" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input 
                          id="name" 
                          value={customerData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={customerData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        value={customerData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required 
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card className="mb-6 bg-white border-petrol-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-petrol-900">
                      <MapPin className="h-5 w-5" />
                      Endereço de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="zipCode">CEP</Label>
                        <Input 
                          id="zipCode" 
                          value={customerData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          required 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Endereço</Label>
                        <Input 
                          id="address" 
                          value={customerData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        <Input 
                          id="city" 
                          value={customerData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">Estado</Label>
                        <Input 
                          id="state" 
                          value={customerData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card className="bg-white border-petrol-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-petrol-900">
                      <CreditCard className="h-5 w-5" />
                      Informações de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input 
                        id="cardNumber" 
                        value={customerData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cardName">Nome no Cartão</Label>
                        <Input 
                          id="cardName" 
                          value={customerData.cardName}
                          onChange={(e) => handleInputChange('cardName', e.target.value)}
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="expiryDate">Validade</Label>
                        <Input 
                          id="expiryDate" 
                          value={customerData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          placeholder="MM/AA"
                          required 
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input 
                          id="cvv" 
                          value={customerData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          placeholder="000"
                          required 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-4 bg-white border-petrol-200">
                  <CardHeader>
                    <CardTitle className="text-petrol-900">Resumo do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cartItems.map((item: any) => (
                      <div key={item.id} className="flex justify-between">
                        <div>
                          <p className="font-medium text-sm text-antracite-900">{item.name}</p>
                          <p className="text-xs text-antracite-600">
                            {item.quantity} {item.quantity === 1 ? 'metro' : 'metros'}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-antracite-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-antracite-700">Subtotal</span>
                        <span className="text-antracite-900">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-antracite-700">Frete</span>
                        <span className="text-antracite-900">
                          {shippingCost === 0 ? 'Grátis' : formatPrice(shippingCost)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-antracite-900">Total</span>
                      <span className="text-petrol-900">{formatPrice(total)}</span>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-petrol-600 hover:bg-petrol-700 text-white"
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Processando..." : "Finalizar Pedido"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
