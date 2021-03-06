const Genre = require('../models/genre');
const Book  = require('../models/book');
const async = require('async');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// 显示完整的书籍种类列表
exports.genre_list = function (req, res, next) {

    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function (err, list_genres) {
            if (err) { return next(err); }
            // 成功，执行渲染
            res.render('genre_list', { title: '类型列表', genre_list: list_genres });
        });
}

// 为每位书籍种类显示详细信息的页面
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
            .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('类型未找到');
            err.status = 404;
            return next(err);
        }
        // 成功，执行渲染
        res.render('genre_detail', { title: '书籍类型', genre: results.genre, genre_books: results.genre_books } );
    });

};

// 由 GET 显示创建书籍种类的表单
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', { title: '添加类型' });
};

// 由 POST 处理书籍种类创建操作
exports.genre_create_post =  [

    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),

    // Sanitize (trim and escape) the name field.
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var genre = new Genre(
          { name: req.body.name }
        );


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: '添加类型', genre: genre, errors: errors.array()});
        return;
        }
        else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({ 'name': req.body.name })
                .exec( function(err, found_genre) {
                     if (err) { return next(err); }

                     if (found_genre) {
                         // Genre exists, redirect to its detail page.
                         res.redirect(found_genre.url);
                     }
                     else {

                         genre.save(function (err) {
                           if (err) { return next(err); }
                           // Genre saved. Redirect to genre detail page.
                           res.redirect(genre.url);
                         });

                     }

                 });
        }
    }
];

// 由 GET 显示删除书籍种类的表单
exports.genre_delete_get = function(req, res, next) { 
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err) }
        if (results.genre==null) { // 没有结果
            res.redirect('/catalog/genres');
        }
        //成功，执行渲染
        res.render('genre_delete', { title: '删除类型', genre: results.genre, genre_books: results.genre_books} );
    });

};

// 由 POST 处理书籍种类删除操作
exports.genre_delete_post = (req, res) => { 
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback)
        },
        genre_books: function(callback) {
            Book.find({ 'genre': req.body.genreid }).exec(callback)
        }
    }, function(err, results) {
        if (err) { return next(err); }
        //成功
        if(results.genre_books.length > 0){
            //Genre尚有书籍，渲染到genres界面下
            res.render('genre_delete', { title: '删除类型', genre: results.genre, genre_books: results.genre_books} );
            return;
        }
        else {
            //Genre没有书籍，删除此Genre并路由到Genre List界面
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if(err) { return next(err); }
                // 成功，路由到Genre List界面
                res.redirect('/catalog/genres')
            })
        }
    })
};

// 由 GET 显示更新书籍种类的表单
exports.genre_update_get = (req, res) => { res.send('未实现：书籍种类更新表单的 GET'); };

// 由 POST 处理书籍种类更新操作
exports.genre_update_post = (req, res) => { res.send('未实现：更新书籍种类的 POST'); };