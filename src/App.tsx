import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, X, MessageCircle, HelpCircle, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: number;
  name: string;
  price: number;
  icon?: string;
  image?: string;
  description: string;
}

interface CartItem extends Product {
  quantity: number;
}

const PRODUCTS: Product[] = [
  { id: 7, name: 'Bir Pletok', price: 5000, image: 'https://lh3.googleusercontent.com/d/1g31sNZZhl060RObcHoF-qEOCWCZraEx6', description: 'Minuman rempah khas Betawi yang segar dan menghangatkan.' },
  { id: 8, name: 'Kerak Telor', price: 20000, image: 'https://lh3.googleusercontent.com/d/1wavXbNPYqV374iEwSgLzsMY5X9CviMAI', description: 'Makanan ikonik Betawi dengan rasa gurih yang otentik.' },
  { id: 9, name: 'Candil', price: 7000, image: 'https://lh3.googleusercontent.com/d/1wFmb6av4NRWRfUQTMy-y6cBWN2hqpXVC', description: 'Bubur manis dengan bola-bola ketan yang kenyal.' },
  { id: 10, name: 'Nasi Uduk', price: 15000, image: 'https://lh3.googleusercontent.com/d/1QjF8u2gIotm9dZcbT7glUGNy-DTHIYx2', description: 'Nasi gurih dengan lauk lengkap khas Tegal Parang.' },
  { id: 1, name: 'Kripik Tempe RW.04', price: 15000, icon: '🥨', description: 'Gurih, renyah, camilan khas Tegal Parang.' },
  { id: 2, name: 'Sambal Rumahan', price: 25000, icon: '🌶️', description: 'Pedas mantap, tanpa pengawet.' },
  { id: 3, name: 'Kaos Katar04', price: 85000, icon: '👕', description: 'Bahan premium, sablon awet.' },
  { id: 4, name: 'Kue Kering Ibu Juju', price: 45000, icon: '🍪', description: 'Manis legit, resep turun temurun.' },
  { id: 5, name: 'Es Teh Segar', price: 5000, icon: '🥤', description: 'Pelepas dahaga di siang hari.' },
  { id: 6, name: 'Kerajinan Tangan', price: 50000, icon: '🎨', description: 'Karya kreatif pemuda RW.04.' },
];

export default function App() {
  const [cart, setCart] = useState<Record<number, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingData, setShippingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingData(prev => ({ ...prev, [name]: value }));
  };

  const addToCart = (id: number) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => {
      const newQty = (prev[id] || 0) + delta;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const getTotal = () => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const product = PRODUCTS.find(p => p.id === Number(id));
      return total + (product?.price || 0) * qty;
    }, 0);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkoutWhatsApp = async () => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    setIsSubmitting(true);

    // Prepare message for WhatsApp
    let message = "*PESANAN BARU - KATAR04*\n\n";
    message += `*Data Pemesan:*\n`;
    message += `Nama: ${shippingData.firstName} ${shippingData.lastName}\n`;
    message += `Email: ${shippingData.email}\n`;
    message += `Alamat: ${shippingData.address}\n`;
    message += `Kota: ${shippingData.city}\n`;
    message += `Kode Pos: ${shippingData.postalCode}\n\n`;
    
    message += `*Daftar Produk:*\n`;
    Object.entries(cart).forEach(([id, qty]) => {
      const product = PRODUCTS.find(p => p.id === Number(id));
      if (product) {
        message += `- ${product.name} (${qty}x) @Rp ${product.price.toLocaleString()}\n`;
      }
    });

    message += `\n*TOTAL HARGA: Rp ${getTotal().toLocaleString()}*\n`;
    message += `\n_Waktu Pemesanan: ${formattedDate}_`;
    // Data for Google Sheets
    const productsList = Object.entries(cart).map(([id, qty]) => {
      const product = PRODUCTS.find(p => p.id === Number(id));
      return product ? `${product.name} (${qty}x)` : '';
    }).filter(Boolean).join(', ');

    const payload = {
      'Nama Depan': shippingData.firstName,
      'Nama Belakang': shippingData.lastName,
      'Email': shippingData.email,
      'Alamat': shippingData.address,
      'Kota': shippingData.city,
      'Kode Pos': shippingData.postalCode,
      'Nama Produk': productsList,
      'Total Harga': `Rp ${getTotal().toLocaleString()}`,
      'Waktu & Tanggal': formattedDate
    };

    try {
      // Step 1: Send to Google Sheets (Fire and Forget)
      fetch('https://script.google.com/macros/s/AKfycbxzc3Ly45RCGgE5D-R66tZ0XOCVtO1O10i8NRvv9_Fclw-iBiK5XJQrf3MQ9qgJ5cmwng/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(err => console.error('Silent logging error:', err));

      // Step 2: Immediate WhatsApp redirect
      const url = `https://wa.me/628561189540?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error in checkout:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return Object.values(shippingData).every(value => value.trim() !== '') && Object.keys(cart).length > 0;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto bg-white rounded-3xl border border-[#e2e8f0] shadow-sm p-4 md:px-8 mb-6 flex items-center justify-between">
        <div className="text-2xl font-extrabold tracking-tighter">
          KATAR<span className="text-orange-500">04</span>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] px-4 py-2 rounded-xl font-bold transition-all"
        >
          <ShoppingCart size={20} />
          <span className="hidden sm:inline">Keranjang</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full animate-in zoom-in">
              {cartCount}
            </span>
          )}
        </button>
      </header>

      {/* Main Bento Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Hero Section */}
        <section className="md:col-span-4 bg-gradient-to-br from-orange-500 to-orange-400 rounded-[2rem] p-8 text-white flex flex-col justify-center min-h-[300px] md:min-h-0 relative overflow-hidden">
          <div className="relative z-10">
            <span className="uppercase text-[0.7rem] font-bold tracking-[0.2em] opacity-80">UMKM Tegal Parang</span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] mt-4 mb-6">
              Produk Lokal,<br />Kualitas Global.
            </h1>
            <p className="text-sm opacity-90 leading-relaxed max-w-[280px]">
              Dukungan penuh untuk usaha kreatif warga RW.04 Tegal Parang. Belanja mudah, harga ramah.
            </p>
          </div>
          <div className="absolute top-[-10%] right-[-10%] opacity-20 transform rotate-12">
            <ShoppingCart size={200} />
          </div>
        </section>

        {/* Product Cards Grid */}
        <section className="md:col-span-8 bg-[#f1f5f9] rounded-[2rem] p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCTS.map(product => (
            <motion.div 
              key={product.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl p-4 flex flex-col justify-between border border-transparent hover:border-orange-500 transition-colors shadow-sm"
            >
              <div className="w-full aspect-square bg-[#f8fafc] rounded-xl flex items-center justify-center text-5xl mb-4 overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  product.icon
                )}
              </div>
              <div className="mb-4">
                <h3 className="font-bold text-sm">{product.name}</h3>
                <p className="text-xs text-[#64748b] mt-1 line-clamp-1">{product.description}</p>
                <div className="text-orange-500 font-bold mt-2">Rp {product.price.toLocaleString()}</div>
              </div>
              <button 
                onClick={() => addToCart(product.id)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Tambah
              </button>
            </motion.div>
          ))}
        </section>

        {/* FAQ Section */}
        <section className="md:col-span-4 bg-white rounded-[2rem] p-8 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="text-orange-500" size={24} />
            <h2 className="font-bold">Bantuan & FAQ</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-orange-500 mb-1">Bagaimana cara pesan?</p>
              <p className="text-sm text-[#64748b]">Pilih produk favorit Anda, tambah ke keranjang, lalu klik checkout untuk terhubung via WhatsApp.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-orange-500 mb-1">Metode Pembayaran?</p>
              <p className="text-sm text-[#64748b]">Pembayaran bisa melalui Transfer Bank atau COD saat pengambilan barang.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-orange-500 mb-1">Lokasi Pengambilan?</p>
              <p className="text-sm text-[#64748b]">Sekretariat RW.04 Tegal Parang, Mampang Prapatan.</p>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="md:col-span-8 bg-[#1e293b] rounded-[2rem] p-8 text-[#94a3b8] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-[#334155] p-3 rounded-2xl">
              <MapPin className="text-orange-500" />
            </div>
            <div>
              <p className="text-white font-bold">Sekretariat RW.04 Tegal Parang</p>
              <p className="text-sm">Jl. Tegal Parang Utara, Mampang Prapatan, Jakarta Selatan</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="text-white font-extrabold tracking-tighter mb-2 text-xl">
              KATAR<span className="text-orange-500">04</span>
            </div>
            <p className="text-xs">© 2026 Karang Taruna Unit 04. Made with ❤️ for Tegal Parang.</p>
          </div>
        </footer>
      </main>

      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Keranjang Belanja</h2>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-[#f1f5f9] rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(cart).length === 0 ? (
                    <div className="text-center py-12 text-[#94a3b8]">
                      <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Keranjang masih kosong nih.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Product List */}
                      <div className="space-y-4">
                        <h3 className="font-bold text-sm text-[#64748b] uppercase tracking-wider">Item Pesanan</h3>
                        {Object.entries(cart).map(([id, qty]) => {
                          const product = PRODUCTS.find(p => p.id === Number(id));
                          if (!product) return null;
                          return (
                            <div key={id} className="flex items-center gap-4 py-2 border-bottom border-[#f1f5f9]">
                              <div className="w-16 h-16 bg-[#f8fafc] rounded-xl flex items-center justify-center text-3xl overflow-hidden shrink-0">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  product.icon
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-sm">{product.name}</h4>
                                <p className="text-xs text-orange-500 font-bold">Rp {(product.price * qty).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-3 bg-[#f1f5f9] p-1 rounded-lg">
                                <button onClick={() => updateQty(Number(id), -1)} className="p-1 hover:bg-white rounded transition-colors shadow-sm">
                                  <Minus size={14} />
                                </button>
                                <span className="text-sm font-bold w-4 text-center">{qty}</span>
                                <button onClick={() => updateQty(Number(id), 1)} className="p-1 hover:bg-white rounded transition-colors shadow-sm">
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Shipping Form */}
                      <div className="space-y-4 pt-4 border-t border-[#f1f5f9]">
                        <h3 className="font-bold text-sm text-[#64748b] uppercase tracking-wider">Data Pengiriman</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#94a3b8] ml-1">Nama Depan</label>
                            <input 
                              type="text" name="firstName" value={shippingData.firstName} onChange={handleInputChange}
                              placeholder="Contoh: Budi"
                              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#94a3b8] ml-1">Nama Belakang</label>
                            <input 
                                type="text" name="lastName" value={shippingData.lastName} onChange={handleInputChange}
                                placeholder="Contoh: Santoso"
                                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-[#94a3b8] ml-1">Email</label>
                          <input 
                            type="email" name="email" value={shippingData.email} onChange={handleInputChange}
                            placeholder="budi@email.com"
                            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-[#94a3b8] ml-1">Alamat Lengkap</label>
                          <textarea 
                            name="address" value={shippingData.address} onChange={handleInputChange}
                            placeholder="Alamat lengkap rumah..."
                            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors min-h-[80px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#94a3b8] ml-1">Kota</label>
                            <input 
                              type="text" name="city" value={shippingData.city} onChange={handleInputChange}
                              placeholder="Jakarta Selatan"
                              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-[#94a3b8] ml-1">Kode Pos</label>
                            <input 
                              type="text" name="postalCode" value={shippingData.postalCode} onChange={handleInputChange}
                              placeholder="12720"
                              className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-[#f1f5f9]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-lg">Total Pembayaran</span>
                    <span className="text-2xl font-black text-orange-500">Rp {getTotal().toLocaleString()}</span>
                  </div>
                  <button 
                    disabled={!isFormValid() || isSubmitting}
                    onClick={checkoutWhatsApp}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-500/20"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MessageCircle size={24} />
                    )}
                    {isSubmitting ? 'Memproses...' : (isFormValid() ? 'Kirim Pesanan (WhatsApp)' : 'Lengkapi Data Pengiriman')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
