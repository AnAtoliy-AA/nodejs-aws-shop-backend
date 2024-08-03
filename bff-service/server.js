const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const app = express();
const port = process.env.PORT || 3000;

dotenv.config();

app.use(express.json());

app.use(async (req, res) => {
  const pathParts = req.path.split('/');
  const recipientServiceName = pathParts[1];
  const recipientURL = process.env[`${recipientServiceName.toUpperCase()}_SERVICE_URL`];

  if (!recipientURL) {
    return res.status(502).json({ message: 'Cannot process request' });
  }

  try {
    const response = await axios({
      method: req.method,
      url: `${recipientURL}${req.url}`,
      headers: req.headers,
      data: req.body,
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    res.status(error.response ? error.response.status : 500).send(error.response ? error.response.data : 'Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`BFF Service listening on port ${port}`);
});
