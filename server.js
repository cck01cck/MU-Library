const express = require("express")
const app = express()
const MongoClient = require('mongodb').MongoClient;
const mongourl = "mongodb+srv://pnhNSAnNF1yUE8Dc:SQdkUxu5FDs31mlq@cluster0.bqcior1.mongodb.net/book?retryWrites=true&w=majority"
const dbName = 'book';
const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
const client = new MongoClient(mongourl)
const assert = require('assert')
const bodyParser = require('body-parser')
const session = require('express-session')
const flash = require('express-flash')
const fs = require('fs')
const formidable = require('formidable');
const path = require('path')
const multer = require('multer')
const bookModel = require('./model/bookModel')
const accountModel = require('./model/accountModel')



const connectDB = () => {
    mongoose.connect(mongourl);
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
}

app.use(flash())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
    secret: 'mySecret',
    name: 'user',
    saveUninitialized: false,
    resave: true,
    cookie: { maxAge: 6000000 }
}))
app.use(express.static(__dirname + '/public'))

app.set('views', path.join(__dirname, 'views'));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

var upload = multer({ storage: storage })


app.get('/pagomatopn', (req, res) => {
    res.render('pagomatopn.ejs')
})


// index page
app.get('/index', (req, res, next) => {
    if (req.session.user) {
        res.render('index.ejs', { name: req.session.user })
    } else {
        res.redirect('/login')
    }

})

//restful services
app.get('/api/book/title/:title', (req, res) => {
    connectDB()
    bookModel.find({ "title": req.params.title }, (err, items) => {
        if (err) {
            console.log(err)
        } else {
            res.json(items)
        }
    })

})

app.get('/api/book/author/:author', (req, res) => {
    connectDB()
    bookModel.find({ "author": req.params.author }, (err, items) => {
        if (err) {
            console.error(err)
        } else {
            res.json(items)
        }
    })
})

//login page
app.get('/', (req, res) => {
    console.log(req.session)
    var user = req.session.user
    if (!user) {
        user = "guest"
    }
    res.redirect('/login')
})

//edit page
app.get('/edit', (req, res) => {
    if (!req.session.user) {
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        connectDB()
        bookModel.find({ "_id": req.query._id }, (err, items) => {
            if (err) {
                console.log(err)
            } else {
                console.log(req.query._id)
                res.render('edit.ejs', { items: items })
            }
        })
    }
})

app.post('/edit', upload.single('filetoupload'), (req, res) => {
    var user = req.session.user;
    var getdata;
    if (!user) {
        user = "demo"
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        
            var getdata = {  
                title: req.body.title,
                author: req.body.author,
                quantity: req.body.qty,
                type: req.body.type,
                language: req.body.language,
                manager:user
            }
        var getManager = "";
        var check
        connectDB()
        bookModel.find({ "_id": req.body._id }, (err, items) => {
            if (err) { console.log('error') };
            getManager = items[0].manager
            if (getManager === req.session.user) {
                check = true
            }
            console.log(req.session.user)
            if (check) {
                bookModel.findByIdAndUpdate({ "_id": req.body._id }, getdata, (err, item) => {
                    if (err) { console.log('error') };
                    res.redirect(`/detail?_id=${req.body._id}`)
                })
            } else {
                res.send(`<script>alert("wrong manager"); location.href = "/edit?_id=${req.body._id}"</script>`)
            }
        })
    }
})

//delete book
app.get('/delete', (req, res) => {
    var getManager = "";
    var check
    if (!req.session.user) {
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        connectDB()
        bookModel.find({ "_id": req.query._id }, (err, items) => {
            if (err) { console.log('error') };
            getManager = items[0].manager
            if (getManager === req.session.user) {
                check = true
            }
            console.log(req.session.user)
            if (check) {
                bookModel.deleteOne({ _id: req.query._id }, (err, result) => {
                    if (err) console.log(err);
                    res.render('delete.ejs')
                })
            } else {
                res.send(`<script>alert("wrong manager"); location.href = "/detail?_id=${req.query._id}"</script>`)
            }
        })


    }

})



//show book detail 
app.get('/detail', (req, res) => {
    if (!req.session.user) {
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        connectDB()
        bookModel.find({ "_id": req.query._id }, (err, items) => {
            if (err) {
                console.log(err)
            } else {
                console.log(req.query._id)
                res.render('detail.ejs', { items: items })
            }
        })
    }
})


//create book 
app.get('/create', (req, res) => {
    if (!req.session.user) {
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        res.render('create.ejs')
    }
})

app.post('/create', upload.single('filetoupload'), (req, res, next) => {
    const form = new formidable.IncomingForm();
    var getdata
    var user = req.session.user;
    if (!user) {
        user = "demo"
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
            var getdata = {
                title: req.body.title,
                author: req.body.author,
                quantity: req.body.qty,
                type: req.body.type,
                language: req.body.language,
                manager:user
            }
        console.log(getdata)
        connectDB()

        bookModel.create(getdata, (err, items) => {
            if (err) return handleError(err);
            console.log('Inserted')
            res.redirect('/view')
        })

    }


})

//view item and search the item by name
app.get('/view', (req, res) => {
    connectDB()
    if (!req.session.user) {
        res.send("<script>alert('overtime');location.href = '/login'</script>")
    } else {
        if (req.query.search) {
            bookModel.find({ "title": { $regex: req.query.search, $options: 'i' } }, (err, items) => {
                if (err) {
                    console.log(err)
                } else {
                    res.render('view.ejs', { items: items })
                }
            })
        } else {
            bookModel.find({}, (err, items) => {
                if (err) {
                    console.log(err)
                } else {
                    res.render('view.ejs', { items: items })
                }
            })
        }
    }
})

//login authentication
app.get('/login', (req, res) => {
    if (!req.session.user) {
        res.render('login.ejs')
    } else {
        res.redirect('/view')
    }
})

app.post('/login', (req, res) => {
    var user = req.body.user
    var password = req.body.password
    var path

    connectDB()
    accountModel.find({}, (err, items) => {
        if (err) return err;
        items.forEach((item) => {
            if (item.username === user && item.password === password) {
                req.session.user = item.username
                path = true
            }
        })
        if (path) {
            res.redirect('/view')
        } else {
            res.send("<script>alert('username or password is incorrect, please try again');location.href = '/login'</script>")
        }
    })
})



//handle logout(session destroy)
app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

//create account 
app.get('/createAccount', (req, res) => {
    res.render('createAccount.ejs')
})

app.post('/createAccount', (req, res) => {
    var userData
    if (req.body.password === "") {
        var userData = {
            username: req.body.user,
            password: ""
        }
    } else {
        var userData = {
            username: req.body.user,
            password: req.body.password
        }
    }
    var path
    connectDB()
    if (req.body.user === "") {
        alert("Please enter")
        res.redirect('/createAccount')
    } else {
        accountModel.find({}, (err, items) => {
            items.forEach((item) => {
                if (err) return err;
                if (item.username === req.body.user) {
                    path = true
                }
            })
            if (path) {
                res.send("<script>alert('the username may inserted');location.href = '/createAccount'</script>")

            } else {
                accountModel.create(userData, (err, result) => {
                    if (err) return err;
                    console.log(result)
                    res.send("<script>alert('create successful');location.href = '/login'</script>")
                })
            }
        })
    }
})

app.get('/target', (req,res)=>{
    const c = session.Cookie
})

app.get('/simpleinterest',(req,res)=>{
    var arr = {"p": req.query.p, "r": req.query.r, "t": req.query.t, "i": req.query.p*req.query.r*req.query.t}
    if(arr == null){
        return;
    }
    return res.json(arr)
})


app.listen(process.env.PORT || 8099)