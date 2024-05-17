const express = require('express');
const axios = require('axios');

const app = express();
const port = 5000;

app.get('/api/data', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        res.send(response.data);
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        res.status(500).send('Error fetching data');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
