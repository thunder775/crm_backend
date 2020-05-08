const express = require('express');
const bcrypt = require('bcrypt');
const MongoClient = require('mongodb').MongoClient;
const cookieSession = require('cookie-session')
const app = express();
const port = 7007;
const bodyParser = require('body-parser');
const url = "mongodb+srv://thunder:nuttert00ls@cluster0-rtl4c.gcp.mongodb.net/test?retryWrites=true&w=majority"
let client;
app.use(cookieSession({
    name: 'session',
    secret: 'thunder775',
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
        "Access-Control-Allow-Headers",
        "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
    next();
});

app.listen(port, async () => {
    client = await MongoClient.connect(url);
    console.log(`server ${port}`)
});
app.get('/', (req, res) => {
    res.send('hey there')
});
let customer = {
    name: 'Rahul',
    number: '777777777',
    gender: 'Male',
    id: 555
};
let customers = [customer];
app.get('/customers', async (request, response) => {
    if (request.session.userId !== undefined) {
        let data = (await client.db('form').collection('customers').find().toArray()).filter((customer) => customer.isActive === true && customer.owner === request.session.userId);
        response.status(200).send(data)
    }
    response.status(403).send();

});
app.post('/customers/add', async (request, response) => {
    console.log(request.session.userId);
    request.body['isActive'] = true;
    request.body['owner'] = request.session.userId;
    let result = await client.db('form').collection('customers').insert(request.body);
    response.send(result.toString())
});
app.post('/customers/undo', async (request, response) => {
    let result = await client.db('form').collection('customers').updateOne({id: request.body.id},
        {
            $set: {isActive: true},

        });
    response.send(result.toString());
});
app.post('/signup', async (request, response) => {
    console.log(request.session);
    let hash = await bcrypt.hash(request.body.pwd, 10);
    let user = await client.db('form').collection('users').find({user: request.body.user}).toArray();
    if (user.length === 0) {
        let result = await client.db('form').collection('users').insert({user: request.body.user, pwd: hash});
        if (result !== null) {
            response.send({status: 'user successfully created'})
        } else {
            response.send({status: 'User already exists'})
        }
    } else {
        response.send({status: 'User already exists'})
    }
});
app.post('/login', async (request, response) => {
    let user = await client.db('form').collection('users').find({user: request.body.user}).toArray();
    if (user.length !== 0) {
        let isPasswordCorrect = await bcrypt.compare(request.body.pwd, user[0].pwd);
        if (isPasswordCorrect) {
            request.session.userId = user[0]._id;
            response.status(200).send()
        }
    }
    response.status(403).send()

});


app.get('/customers/:user', function (req, res) {
    let found = searchFromCustomers(req.params.user);
    res.send(found === undefined ? found : 'not Found');
});
app.post('/customers/delete', async (req, res) => {
    let result = await client.db('form').collection('customers').updateOne({id: req.body.id},
        {
            $set: {isActive: false},

        });
    res.send(result.toString());
});

function deleteCustomer(userID) {
    for (let i = 0; i < customers.length; i++) {
        if (customers[i].id === Number(userID)) {
            customers.splice(i, 1);
            return true;
        }
    }
    return false;
}

function searchFromCustomers(userID) {
    return customers.find((user) => user.customerID === Number(userID)
    )
}

function generateRandomCustomer() {
    return {
        name: 'Rahul',
        number: Math.floor((Math.random() * 100) + 1),
        gender: 'Male',
        id: Math.floor((Math.random() * 100) + 1)
    }
}