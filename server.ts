import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending receipts via Brevo
  app.post("/api/send-receipt", async (req, res) => {
    const { email, order, restaurant } = req.body;
    const authHeader = req.headers.authorization;

    if (!email || !order || !restaurant || !authHeader) {
      return res.status(400).json({ error: "Missing required fields or authorization" });
    }

    // 1. Verify User Session with Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const token = authHeader.split(" ")[1];
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // 2. Verify that this user actually has access to this order
    // This will trigger RLS on the 'orders' table
    const { data: verifiedOrder, error: verifyError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', order.id)
      .single();

    if (verifyError || !verifiedOrder) {
      console.error("Unauthorized receipt request:", verifyError);
      return res.status(403).json({ error: "Unauthorized: You do not have access to this order" });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "Scanank";

    if (!apiKey || !senderEmail) {
      console.error("Brevo API Key or Sender Email not configured");
      return res.status(500).json({ error: "Email service not configured" });
    }

    // Generate visually appealing HTML receipt
    const itemsHtml = order.order_items.map((item: any) => {
      const price = item.price || item.unit_price || 0;
      const quantity = item.quantity || 1;
      const total = price * quantity;
      
      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
            <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${item.menu_items?.name || 'Item'}</div>
            <div style="color: #64748b; font-size: 12px;">Qty: ${quantity}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; vertical-align: top; font-weight: 500; color: #1e293b; font-size: 14px;">
            Rs. ${total.toFixed(2)}
          </td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <!-- Header -->
          <div style="padding: 32px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
            <h1 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${restaurant.name}</h1>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">${restaurant.address || ''}</p>
            ${restaurant.phone ? `<p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Tel: ${restaurant.phone}</p>` : ''}
          </div>

          <!-- Order Info -->
          <div style="padding: 24px 32px; background-color: #f8fafc; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Order Details</span>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Order ID:</td>
                <td style="padding: 4px 0; color: #1e293b; font-size: 14px; text-align: right; font-weight: 600;">#${order.id.slice(0, 8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Date:</td>
                <td style="padding: 4px 0; color: #1e293b; font-size: 14px; text-align: right;">${new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Table:</td>
                <td style="padding: 4px 0; color: #1e293b; font-size: 14px; text-align: right;">${order.tables?.table_number || 'N/A'}</td>
              </tr>
              ${order.customer_name ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Customer:</td>
                <td style="padding: 4px 0; color: #1e293b; font-size: 14px; text-align: right; font-weight: 500;">${order.customer_name}</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Items -->
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; padding-bottom: 12px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9;">Item</th>
                  <th style="text-align: right; padding-bottom: 12px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #f1f5f9;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Totals -->
            <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #f1f5f9;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Subtotal</td>
                  <td style="padding: 4px 0; color: #1e293b; font-size: 14px; text-align: right;">Rs. ${(order.subtotal || order.total_amount).toFixed(2)}</td>
                </tr>
                ${order.tax_amount > 0 ? `
                <tr>
                  <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Tax</td>
                  <td style="padding: 4px 0; color: #1e293b; font-size: 14px; text-align: right;">Rs. ${order.tax_amount.toFixed(2)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 12px 0 0; color: #0f172a; font-size: 18px; font-weight: 800;">Total</td>
                  <td style="padding: 12px 0 0; color: #0f172a; font-size: 20px; font-weight: 800; text-align: right;">Rs. ${order.total_amount.toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 32px; text-align: center; background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; color: #1e293b; font-size: 15px; font-weight: 600;">Thank you for your visit!</p>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">We hope to see you again soon.</p>
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Receipt sent via ${senderName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: email,
            },
          ],
          subject: `Your Receipt - ${restaurant.name}`,
          htmlContent: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Brevo API Error:", errorData);
        return res.status(response.status).json({ error: "Failed to send email via Brevo" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
