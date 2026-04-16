const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - parse JSON bodies from requests
app.use(express.json());

// Serve all frontend files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// API route - proxy to Anthropic so the API key stays secret on the server
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const PRODUCTS = [
    "Laptop (Electronics) - $1000", "Phone (Electronics) - $500",
    "Tablet (Electronics) - $300", "Headphones (Electronics) - $150",
    "Smart Watch (Electronics) - $200", "Camera (Electronics) - $800",
    "Notebook (Stationery) - $5", "Pen (Stationery) - $2",
    "Pencil (Stationery) - $1", "Marker (Stationery) - $3",
    "Eraser (Stationery) - $1", "Stapler (Stationery) - $6",
    "T-Shirt (Clothing) - $20", "Jeans (Clothing) - $40",
    "Bag (Clothing) - $25", "Jacket (Clothing) - $60",
    "Shoes (Clothing) - $70", "Cap (Clothing) - $15",
  ];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You are a friendly shopping assistant for SmartCart.
Help users find products and make recommendations. Keep replies to 2-3 sentences max.
Available products: ${PRODUCTS.join(", ")}`,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Anthropic API error");
    }

    const reply = data.content?.[0]?.text || "Sorry, I could not get a response.";
    res.json({ reply });

  } catch (error) {
    console.error("Chat error:", error.message);
    res.status(500).json({ error: "Assistant unavailable. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`SmartCart server running on http://localhost:${PORT}`);
});
