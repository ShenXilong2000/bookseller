var express = require('express');
var app = new express();  /*实例化*/
//获取post
var bodyParser = require('body-parser');
// 设置body-parser中间件
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//数据库操作

//数据库操作
var DB = require('./modules/db.js');

//保存用户信息
var session = require("express-session");
//配置中间件  固定格式
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 30
    },
    rolling: true
}))


//使用ejs模板引擎   默认找views这个目录
app.set('view engine', 'ejs');
//配置public目录为我们的静态资源目录
app.use('/public', express.static('public'));
//   upload/Aj8HIYV_EqbkNdCNwkYJiL33.jpg\
//  Aj8HIYV_EqbkNdCNwkYJiL33.jpg
app.use('/upload', express.static('upload'));

const POST = 8080;
const server = app.listen(POST,() => {
    const host = "127.0.0.1"
    const port = server.address().port
    console.log("应用实例，访问地址为 http://%s:%s", host, port)
});


app.use(function (req, res, next) {
    //console.log(req.url);
    //next();
    if (req.url == '/login' || req.url == '/doLogin') {
        next();
    }
    else if(req.url == '/productadd' || req.url == '/productadd' || req.url == '/productedit' || req.url == '/doProductEdit' || req.url == '/productdelete'){
        if(req.session.status == 1){
            next();
        }
        else{
            res.send("<script>alert('无权访问');location.href='/product'</script>");
        }
    }
    else {
        if (req.session.userinfo && req.session.userinfo.username != '') {   /*判断有没有登录*/
            app.locals['userinfo'] = req.session.userinfo;   /*配置全局变量  可以在任何模板里面使用*/
            next();
        } else {
            res.redirect('/login')
        }
    }

})

app.get('/', function (req, res) {
    res.send('index');
})

//登录
app.get('/login', function (req, res) {
    //res.send('login');
    res.render('login');

})
//注册
app.get('/signinPage', function (req, res) {
    //res.send('login');
    res.render('signinPage');
})



//获取登录提交的数据
app.post('/dosignin', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    DB.find('use', {
        username: username,
        password: password
    }, function (err, data) {
        if (data.length > 0) {
            res.send("<script>alert('用户名已注册');location.href='/login'</script>");
        } else {
            DB.insert('use', {
                username: username,
                password: password,
                status: 0
            }, function (err, data){
                if(!err){
                    res.send("<script>alert('注册成功');location.href='/login'</script>");
                    res.redirect('/login')
                }
            });
        }
    })
})

//获取注册提交的数据
app.post('/doLogin', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    DB.find('use', {
        username: username,
        password: password
    }, function (err, data) {
        if (data.length > 0) {
            console.log('登录成功');
            console.log(data)
            //保存用户信息
            req.session.userinfo = data[0];
            req.session.status = data[0].status;
            
            res.redirect('/product');  /*登录成功跳转到书本列表*/
        } else {
            //console.log('登录失败');
            res.send("<script>alert('登录失败');location.href='/login'</script>");
        }
    })
})


//书本列表
app.get('/product', function (req, res) {
    DB.find('product', {}, function (err, data) {
        console.log(data)
        res.render('product', {
            list: data
        });
    })

})
//显示增加书本的页面
app.get('/productadd', function (req, res) {
    res.render('productadd');
})

//收藏列表
app.get('/productcollectionPage', function (req, res) {
    DB.find('productcollection', {}, function (err, data) {
        console.log(data);
        res.render('productcollectionPage', {
            list: data
        });
    })

})


app.post('/doProductAdd', function (req, res) {
    console.log(req.body)

    var title = req.body.title;
    var price = req.body.price;
    var fee = req.body.fee;
    var description = req.body.description;

    DB.insert('product', {
        title: title,
        price: price,
        fee,//效果与上面一致
        description,
    }, function (err, data) {
        if (!err) {
            res.redirect('/product'); /*上传成功跳转到首页*/
        }

    })
})

app.get('/productedit', function (req, res) {
    //获取get传值 id
    var id = req.query.id;
    console.log(id);
    //去数据库查询这个id对应的数据     自增长的id 要用{"_id":new DB.ObjectID(id)
    DB.find('product', { "_id": new DB.ObjectID(id) }, function (err, data) {
        //console.log(data);
        res.render('productedit', {
            list: data[0]
        });
    });
})

app.post('/doProductEdit', function (req, res) {

    var _id = req.body._id;
    /*修改的条件*/
    var title = req.body.title;
    var price = req.body.price;
    var fee = req.body.fee;
    var description = req.body.description;

    var setData = {
        title,
        price,
        fee,
        description,
    };



    DB.update('product', { "_id": new DB.ObjectID(_id) }, setData, function (err, data) {

        if (!err) {
            res.redirect('/product');
        }

    })
})

app.get('/productdelete', function (req, res) {
    //获取id
    var id = req.query.id;
    DB.deleteOne('product', { "_id": new DB.ObjectID(id) }, function (err) {
        if (!err) {
            res.redirect('/product');
        }
    })
    //res.send('productdelete');
})


app.get('/loginOut', function (req, res) {
    //销毁session
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/login');
        }
    })
})


//收藏
app.get('/productcollection', function (req, res) {
    //获取get传值 id
    var id = req.query.id;
    console.log(id);
    // 检查是否已经收藏
    DB.find('productcollection', { "_id": new DB.ObjectID(id) }, function (err, data) {
        if(data.length > 0){
            res.redirect('/productcollectionPage')
        }
    });

    //去数据库查询这个id对应的数据     自增长的id 要用{"_id":new DB.ObjectID(id)
    DB.find('product', { "_id": new DB.ObjectID(id) }, function (err, data) {
        DB.insert('productcollection', {
                _id: data[0]._id,
                title: data[0].title,
                price: data[0].price,
                fee: data[0].fee,
                description: data[0].description,
        }, function (err, data){
            if(!err){
                res.redirect('/productcollectionPage')
            }
        });
    });
    
})
//删除收藏
app.get('/productcollectiondelete', function (req, res) {
    //获取id
    var id = req.query.id;
    DB.deleteOne('productcollection', { "_id": new DB.ObjectID(id) }, function (err) {
        if(!err){
            res.redirect('/productcollectionPage')
        }
    })
})


