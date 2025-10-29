const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const cors = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Your Razorpay Keys
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

// Serve HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Kshetram - Digital Products Store</title>
    <style>
        :root {
            --primary: #4CAF50;
            --primary-dark: #388E3C;
            --primary-light: #C8E6C9;
            --accent: #FF5722;
            --text: #333333;
            --text-light: #666666;
            --text-lighter: #999999;
            --background: #f5f5f5;
            --white: #ffffff;
            --border: #e0e0e0;
            --success: #4CAF50;
            --error: #f44336;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
            --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
            --shadow-lg: 0 10px 20px rgba(0,0,0,0.1);
            --radius-sm: 4px;
            --radius-md: 8px;
            --radius-lg: 12px;
            --transition: all 0.3s ease;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: var(--text);
            background-color: var(--background);
            padding: 0;
            margin: 0;
            -webkit-font-smoothing: antialiased;
        }

        .container {
            width: 100%;
            padding: 15px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .store-container, .success-container, .failed-container {
            background: var(--white);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-sm);
            padding: 20px;
            margin: 15px auto;
            overflow: hidden;
        }

        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 20px;
            width: 100%;
        }

        .product-card {
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 16px;
            transition: var(--transition);
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--white);
            position: relative;
        }

        .product-card:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary);
        }

        .product-image-container {
            width: 100%;
            overflow: hidden;
            border-radius: var(--radius-sm);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9f9f9;
            min-height: 200px;
            max-height: 250px;
            position: relative;
        }

        .product-card img {
            width: auto;
            height: auto;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            transition: var(--transition);
        }

        .product-card:hover img {
            transform: scale(1.03);
        }

        .product-info {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }

        .product-info h3 {
            margin: 0 0 8px 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text);
        }

        .product-info p {
            margin: 0 0 8px 0;
            color: var(--text-light);
            font-size: 0.9rem;
            line-height: 1.4;
        }

        .price {
            font-weight: bold;
            color: var(--error);
            font-size: 1.2rem;
            margin: 12px 0;
            display: flex;
            align-items: center;
        }

        .price::before {
            content: '₹';
            margin-right: 2px;
        }

        .buy-btn {
            background-color: var(--primary);
            color: var(--white);
            border: none;
            padding: 12px 15px;
            width: 100%;
            border-radius: var(--radius-sm);
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            transition: var(--transition);
            margin-top: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .buy-btn:hover {
            background-color: var(--primary-dark);
            transform: translateY(-2px);
        }

        .buy-btn:active {
            transform: translateY(0);
        }

        .success-container, .failed-container {
            max-width: 500px;
            text-align: center;
            padding: 30px 20px;
        }

        .success-container h1 {
            color: var(--success);
        }

        .failed-container h1 {
            color: var(--error);
        }

        .download-section {
            margin: 25px 0;
            padding: 20px;
            background: rgba(76, 175, 80, 0.1);
            border-radius: var(--radius-sm);
            border: 1px dashed var(--primary);
        }

        .download-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background-color: var(--primary);
            color: var(--white);
            padding: 12px 24px;
            text-decoration: none;
            border-radius: var(--radius-sm);
            font-size: 1rem;
            font-weight: 500;
            margin: 10px 0;
            transition: var(--transition);
            border: none;
            cursor: pointer;
            width: 100%;
            max-width: 250px;
        }

        .download-btn:hover {
            background-color: var(--primary-dark);
            box-shadow: var(--shadow-md);
        }

        .note {
            font-size: 0.85rem;
            color: var(--text-light);
            margin-top: 10px;
            font-style: italic;
        }

        .back-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-top: 20px;
            color: var(--text);
            text-decoration: none;
            border: 1px solid var(--border);
            padding: 8px 16px;
            border-radius: var(--radius-sm);
            transition: var(--transition);
            font-size: 0.9rem;
        }

        .back-btn:hover {
            background-color: #f5f5f5;
            border-color: var(--primary);
            color: var(--primary);
        }

        h1 {
            margin-bottom: 16px;
            font-size: 1.8rem;
        }

        h2 {
            margin-bottom: 12px;
            font-size: 1.3rem;
            color: var(--text);
        }

        .hidden {
            display: none !important;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: var(--text-light);
        }

        .error-message {
            background: #ffebee;
            color: var(--error);
            padding: 12px;
            border-radius: var(--radius-sm);
            margin: 10px 0;
            text-align: center;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .store-container, .success-container, .failed-container {
                padding: 16px;
                margin: 10px auto;
            }
            
            .product-grid {
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 15px;
            }
            
            .product-image-container {
                min-height: 180px;
                max-height: 220px;
            }
            
            h1 {
                font-size: 1.6rem;
            }
            
            .download-btn {
                padding: 10px 20px;
                font-size: 0.95rem;
            }
        }

        @media (max-width: 480px) {
            .product-grid {
                grid-template-columns: 1fr;
            }
            
            .product-card {
                padding: 14px;
            }
            
            .product-image-container {
                min-height: 160px;
                max-height: 200px;
            }
            
            h1 {
                font-size: 1.4rem;
            }
            
            h2 {
                font-size: 1.1rem;
            }
            
            .success-container, .failed-container {
                padding: 20px 15px;
            }
            
            .download-section {
                padding: 16px;
                margin: 20px 0;
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .product-card {
            animation: fadeIn 0.5s ease forwards;
        }

        .product-card:nth-child(1) { animation-delay: 0.1s; }
        .product-card:nth-child(2) { animation-delay: 0.2s; }
        .product-card:nth-child(3) { animation-delay: 0.3s; }
    </style>
</head>
<body>
    <div class="container">
        <div id="loading" class="loading">
            <p>Loading products...</p>
        </div>

        <div id="error-message" class="error-message hidden">
            <p>Failed to load products. Please refresh the page.</p>
        </div>

        <div id="store-page" class="store-container hidden">
            <div class="product-grid" id="product-grid"></div>
        </div>

        <div id="success-page" class="success-container hidden">
            <h1>Payment Successful!</h1>
            <p>Thank you for your purchase of <strong id="purchased-product"></strong>.</p>
            
            <div class="download-section">
                <h2>Download Your File</h2>
                <a id="download-link" href="#" class="download-btn" target="_blank">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download Now
                </a>
                <p class="note">Link valid for 15 minutes • Thanks For shopping at Digital Kshetram</p>
            </div>
            
            <a href="#" class="back-btn" id="success-back-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Store
            </a>
        </div>

        <div id="failed-page" class="failed-container hidden">
            <h1>Payment Failed</h1>
            <p>We're sorry, but your payment could not be processed.</p>
            <p>Please try again or contact support if the problem persists.</p>
            
            <a href="#" class="back-btn" id="failed-back-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Store
            </a>
        </div>
    </div>

    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
        const CONFIG = {
            API_BASE_URL: '/api',
            RAZORPAY_KEY: 'rzp_live_JpStg2YIkRVnrI'
        };

        let products = {};

        document.addEventListener('DOMContentLoaded', function() {
            loadProducts();
            setupNavigation();
        });

        async function loadProducts() {
            try {
                showLoading();
                hideError();
                
                const response = await fetch('/api/products');
                
                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }
                
                const result = await response.json();
                
                if (result.success) {
                    products = result.data;
                    renderProducts();
                    showStorePage();
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                console.error('Error loading products:', error);
                showError('Failed to load products. Please refresh the page.');
            }
        }

        function renderProducts() {
            const grid = document.getElementById('product-grid');
            grid.innerHTML = '';
            
            Object.entries(products).forEach(([id, product]) => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = \`
                    <div class="product-image-container">
                        <img src="\${product.image}" alt="\${product.name}" loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3>\${product.name}</h3>
                        <p>\${product.description}</p>
                        <p class="price">\${(product.price / 100).toFixed(2)}</p>
                        <button class="buy-btn" data-id="\${id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 2v20M12 2l7 7M12 2L5 9"/>
                            </svg>
                            Buy Now
                        </button>
                    </div>
                \`;
                grid.appendChild(card);
            });
            
            initEventListeners();
        }

        function initEventListeners() {
            document.querySelectorAll('.buy-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = this.getAttribute('data-id');
                    initiatePayment(productId);
                });
            });
        }

        async function initiatePayment(productId) {
            try {
                const product = products[productId];
                if (!product) {
                    alert('Product not found');
                    return;
                }

                const response = await fetch('/api/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ productId })
                });

                if (!response.ok) {
                    throw new Error('Failed to create order');
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error);
                }

                const options = {
                    key: CONFIG.RAZORPAY_KEY,
                    amount: result.data.amount,
                    currency: result.data.currency,
                    name: "Digital Kshetram",
                    description: result.data.productName,
                    order_id: result.data.orderId,
                    handler: async function(response) {
                        await verifyPayment(response, productId);
                    },
                    prefill: {
                        name: "",
                        email: "",
                        contact: ""
                    },
                    theme: {
                        color: "#4CAF50"
                    }
                };

                const rzp = new Razorpay(options);
                
                rzp.on('payment.failed', function(response) {
                    console.error('Payment failed:', response.error);
                    showFailedPage();
                });

                rzp.open();

            } catch (error) {
                console.error('Payment initiation error:', error);
                alert('Failed to initiate payment. Please try again.');
            }
        }

        async function verifyPayment(paymentResponse, productId) {
            try {
                const response = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paymentId: paymentResponse.razorpay_payment_id,
                        orderId: paymentResponse.razorpay_order_id,
                        signature: paymentResponse.razorpay_signature,
                        productId: productId
                    })
                });

                const result = await response.json();

                if (result.success) {
                    showSuccessPage(result.data.productName, result.data.downloadUrl);
                } else {
                    showFailedPage();
                }

            } catch (error) {
                console.error('Payment verification error:', error);
                showFailedPage();
            }
        }

        function setupNavigation() {
            document.getElementById('success-back-btn').addEventListener('click', function(e) {
                e.preventDefault();
                showStorePage();
            });
            
            document.getElementById('failed-back-btn').addEventListener('click', function(e) {
                e.preventDefault();
                showStorePage();
            });
        }

        function showLoading() {
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('error-message').classList.add('hidden');
            document.getElementById('store-page').classList.add('hidden');
            document.getElementById('success-page').classList.add('hidden');
            document.getElementById('failed-page').classList.add('hidden');
        }

        function hideError() {
            document.getElementById('error-message').classList.add('hidden');
        }

        function showError(message) {
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('error-message').classList.remove('hidden');
            document.getElementById('error-message').querySelector('p').textContent = message;
            document.getElementById('store-page').classList.add('hidden');
            document.getElementById('success-page').classList.add('hidden');
            document.getElementById('failed-page').classList.add('hidden');
        }

        function showStorePage() {
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('error-message').classList.add('hidden');
            document.getElementById('store-page').classList.remove('hidden');
            document.getElementById('success-page').classList.add('hidden');
            document.getElementById('failed-page').classList.add('hidden');
        }

        function showSuccessPage(productName, downloadUrl) {
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('error-message').classList.add('hidden');
            document.getElementById('store-page').classList.add('hidden');
            document.getElementById('success-page').classList.remove('hidden');
            document.getElementById('failed-page').classList.add('hidden');
            
            document.getElementById('purchased-product').textContent = productName;
            document.getElementById('download-link').href = downloadUrl;
        }

        function showFailedPage() {
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('error-message').classList.add('hidden');
            document.getElementById('store-page').classList.add('hidden');
            document.getElementById('success-page').classList.add('hidden');
            document.getElementById('failed-page').classList.remove('hidden');
        }
    </script>
</body>
</html>
  `);
});

// API Routes (keep your existing API routes)
app.get('/api/products', (req, res) => {
  res.json({ success: true, data: products });
});

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

    const downloadUrl = \`\${process.env.BASE_URL || 'https://digital-kshetram-store.onrender.com'}/api/download/\${token}\`;
    
    console.log(\`Download token generated for payment: \${paymentId}\`);
    
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
    
    console.log(\`File downloaded: \${product.name} by payment: \${tokenData.paymentId}\`);
    
    // Redirect to Google Drive
    res.redirect(\`https://drive.google.com/uc?export=download&id=\${product.fileId}\`);
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
});
