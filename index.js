var express = require('express');
var app = express();
const cors = require('cors')
var bodyParser = require('body-parser');

app.use(express.json());
app.use(cors());
app.use(bodyParser.json({
    type: 'application/json'
}));
app.use(bodyParser.urlencoded({
    extended: true
}));



var eth = require('./transaction');

var bsc = require('./transactionBsc');
app.use('/api/eth',eth );

app.use('/api/bsc', bsc );




app.get('/', function (request, response) {

    response.contentType('application/json');
    response.end(JSON.stringify("Node is running"));

});


app.get('*', function (req, res) {
    return res.status(404).json({
        msg: 'Page Not Found'
    });
});

app.post('*', function (req, res) {
    return res.status(404).json({
        msg: 'Page Not Found'
    });
});

if (module === require.main) {

    var server = app.listen(process.env.PORT || 5000, function () {
        var port = server.address().port;
        console.log('App listening on port %s', port);
    });

}