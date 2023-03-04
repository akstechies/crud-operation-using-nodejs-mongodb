// Node.js has a built-in module called HTTP. This helps Node.js to send information using the Hyper Text Transfer Protocol (HTTP).
const http = require('http');

// url module provides utilities for URL resolution and parsing. We are using variable as nodeUrl because we have already defined url variable below
const nodeUrl = require('url');

// The MongoClient object provided by the MongoDB driver will be used to create a database connection.
const { MongoClient } = require('mongodb');


// Connection URL
const url = 'mongodb://localhost:27017';

// Initialize the MongoClient
const client = new MongoClient(url);

// Database Name
const dbName = 'crud_app';

// Create an async function which will perform operation based on parameters
async function main(method = 'view', data = false, emailId = false) {

    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('users');
    console.log('method =>', method);
    switch (method) {
        case 'create':
            const insertResult = await collection.insertOne(data);
            return JSON.stringify(insertResult);
        case 'remove':
            const remove = await collection.deleteMany({});
            return 'Removed';
        case 'delete':
            const deleteResult = await collection.deleteOne({ 'email': emailId });
            return JSON.stringify(deleteResult);
        case 'update':
            const updateResult = await collection.updateOne({ 'email': emailId }, { $set: data });
            return JSON.stringify(updateResult);
        default:
            return "View"
    }

}

//Use it to call the main function with parameters so that we can call this function in just one line according to the URL, and it will return the desired result
function defineMain(res, method = false, data = false, emailId = false) {
    main(method, data, emailId)
        .then(result => {
            res.end(result);
        })
        .catch(err => {
            console.error(err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        });
}

// Use this function to create or update the document
function updateDocument(req, res, method, emailId = false) {
    try {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const data = JSON.parse(body);
            defineMain(res, method, data, emailId)
        });
    } catch (error) {
        console.error(error);
        res.statusCode = 500;
        res.end('Internal Server Error');
    }
}

// create http server 
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/create' && req.method === 'POST') {
        updateDocument(req, res, 'create')
    } else if (req.url === '/remove-all') {
        defineMain(res, 'remove')
    } else {
        // Parse the URL and then split it to get the value at index 2, which is the email. This emailId will be used to update or delete the document.
        const urlParts = nodeUrl.parse(req.url, true);
        const emailId = urlParts.pathname.split('/')[2];
        if (urlParts.pathname.startsWith('/delete/')) {
            defineMain(res, 'delete', false, emailId)
        } else if (urlParts.pathname.startsWith('/update/')) {
            updateDocument(req, res, 'update', emailId)
        } else {
            defineMain(res)
        }

    }
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
