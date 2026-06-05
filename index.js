const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static files
app.use('/public', express.static(__dirname + '/public'));

// Homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// In-memory database
let urlDatabase = [];
let counter = 1;

/* =========================
   POST /api/shorturl
========================= */
app.post('/api/shorturl', (req, res) => {
  let inputUrl = req.body.url;

  // Check empty input
  if (!inputUrl) {
    return res.json({ error: 'invalid url' });
  }

  // Add protocol if missing
  if (
    !inputUrl.startsWith('http://') &&
    !inputUrl.startsWith('https://')
  ) {
    inputUrl = 'http://' + inputUrl;
  }

  let urlObj;

  // Validate URL format
  try {
    urlObj = new URL(inputUrl);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }

  // DNS lookup validation
  dns.lookup(urlObj.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = counter++;

    urlDatabase.push({
      original_url: inputUrl,
      short_url: shortUrl
    });

    res.json({
      original_url: inputUrl,
      short_url: shortUrl
    });
  });
});

/* =========================
   GET /api/shorturl/:short_url
========================= */
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  const entry = urlDatabase.find(
    item => item.short_url === shortUrl
  );

  // FCC-safe error response
  if (!entry) {
    return res.json({ error: 'invalid url' });
  }

  return res.redirect(entry.original_url);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});