//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
var url = 'mongodb://fitcal:q757WKd5tHFwtTfBNIBvhJpzbYEcV93Nu0SN7GzfbzIO6ujJ1kP50qgRHFbvw3z34hEj5TUfIyJuWcISCoKVJg==@fitcal.documents.azure.com:10250/?ssl=true';

// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);

    // do some work here with the database.

    //Close connection
    db.close();
  }
});
