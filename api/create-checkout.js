const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const { items } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid cart data' });
      }

      // Build line items for Stripe Checkout
      const lineItems = items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name || item.title || 'Untitled',
            description: item.description || '',
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100), // Convert dollars → cents
        },
        quantity: item.quantity || item.qty || 1,
      }));

      // Create the Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${req.headers.origin || 'https://yourdomain.com'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || 'https://yourdomain.com'}`,
      });

      return res.status(200).json({ url: session.url });
    }

    app.get("/order-details", async (req, res) => {
      const sessionId = req.query.session_id;
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        res.json(session);
      } catch (error) {
        res.json({ error: true });
      }
    });
    
    
    // Allow GET requests to retrieve session details for success page
    if (req.method === 'GET') {
      const { session_id } = req.query;
      if (!session_id) {
        return res.status(400).json({ error: 'Missing session_id' });
      }

      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['line_items', 'line_items.data.price.product'],
      });

      return res.status(200).json(session);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: error.message });
  }
};
