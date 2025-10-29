const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Your Razorpay Keys - UPDATE THESE!
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_JpStg2YIkRVnrI',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_RAZORPAY_SECRET_HERE'
});

const downloadTokens = new Map();

// Your Products
const products = {
  '1': {
    name: 'Ganesh Chaturthi',
    description: 'Photoshop File (PSD)',
    price: 100,
    image: 'https://assets.zyrosite.com/m5KLLWJqb6UzNXNJ/ganesh-1-mp8JZ8Mla3haRj8Q.jpg',
    fileId: '1jmOFteGQ7N5_5ZjRxM_HEzBPXV4sWSlt'
  },
  '2': {
    name: 'Ganesh Chaturthi-2',
    description: 'Photoshop File (PSD)',
    price: 100,
    image: 'https://assets.zyrosite.com/m5KLLWJqb6UzNXNJ/dk_vinayaka-chaturthi-m7Vb42MOpMHqN0Jw.png',
    fileId: '1ZXWOKWPLcmo7CN-ym3dFOTMPG_xPO3_J'
  },
  '3': {
    name: 'Document Pack',
    description: 'Collection of editable templates (ZIP)',
    price: 1000,
    image: 'https://assets.zyrosite.com/m5KLLWJqb6UzNXNJ/f01-mv02255D4rf1l3a3.png',
    fileId: '1jmOFteGQ7N5_5ZjRxM_HEzBPXV4sWSlt'
  },
  '4': {
    name: 'PSD Template',
    description: 'Editable Photoshop temple (PSD)',
    price: 1900,
    image: 'https://assets.zyrosite.com/m5KLLWJqb6UzNXNJ/vsdvvs-mePJ4eGLK3fqB1OD.jpg',
    fileId: '1TQkenCM3EBmjEz_VF8WpxrBCWDTqQmav'
  }
};

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Digital Kshetram API is running!',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Get all products
app.get('/api/products', (req, res) => {
  res.json({ success: true, data: products });
});

// Create Razorpay order
app.post('/api/create-order', async (req, res) => {
  try {
    const { productId } = req.body;
    const product = products[productId];
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const order = await razorpay.orders.create({
      amount: product.price,
      currency: 'INR',
      receipt: `receipt_${productId}_${Date.now()}`,
      notes: {
        productId: productId,
        productName: product.name
      }
    });
    
    console.log(`Order created: ${order.id} for ${product.name}`);
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        productName: product.name
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Verify payment
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { paymentId, orderId, signature, productId } = req.body;
    
    // Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_RAZORPAY_SECRET_HERE')
      .update(orderId + "|" + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      console.error('Invalid signature for payment:', paymentId);
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    const product = products[productId];
    
    // Generate secure download token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes
    
    downloadTokens.set(token, {
      productId,
      paymentId,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString()
    });

    const downloadUrl = `${process.env.BASE_URL || 'https://your-app.onrender.com'}/api/download/${token}`;
    
    console.log(`Download token generated for payment: ${paymentId}`);
    
    res.json({
      success: true,
      data: {
        productName: product.name,
        downloadUrl: downloadUrl,
        expiresIn: '15 minutes'
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
});

// Download file
app.get('/api/download/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const tokenData = downloadTokens.get(token);
    
    if (!tokenData) {
      return res.status(404).json({ error: 'Download link expired or invalid' });
    }
    
    if (tokenData.used) {
      return res.status(400).json({ error: 'Download link already used' });
    }
    
    if (Date.now() > tokenData.expiresAt) {
      downloadTokens.delete(token);
      return res.status(410).json({ error: 'Download link expired' });
    }
    
    // Mark token as used
    tokenData.used = true;
    downloadTokens.set(token, tokenData);
    
    const product = products[tokenData.productId];
    
    console.log(`File downloaded: ${product.name} by payment: ${tokenData.paymentId}`);
    
    // Redirect to Google Drive
    res.redirect(`https://drive.google.com/uc?export=download&id=${product.fileId}`);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [token, data] of downloadTokens.entries()) {
    if (now > data.expiresAt) {
      downloadTokens.delete(token);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired tokens`);
  }
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🚀 Digital Kshetram Server Started!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
✅ Server is running!
  `);
});
