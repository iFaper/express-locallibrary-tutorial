const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const async = require('async');


const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// 显示完整的书籍副本列表
exports.bookinstance_list = function (req, res, next) {

  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      // 成功，执行渲染
      res.render('bookinstance_list', { title: '副本信息', bookinstance_list: list_bookinstances });
    });

};

// 为每位书籍副本显示详细信息的页面
exports.bookinstance_detail = function (req, res, next) {

  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance == null) { // 未匹配到副本
        var err = new Error('副本未找到');
        err.status = 404;
        return next(err);
      }
      // 成功，执行渲染
      res.render('bookinstance_detail', { title: '书名:', bookinstance: bookinstance });
    })

};

// 由 GET 显示创建书籍副本的表单
exports.bookinstance_create_get = function (req, res, next) {

  Book.find({}, 'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', { title: '添加副本', book_list: books });
    });

};

// 由 POST 处理书籍副本创建操作
exports.bookinstance_create_post = [

  // Validate fields.
  body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
  body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
  body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  sanitizeBody('book').trim().escape(),
  sanitizeBody('imprint').trim().escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    var bookinstance = new BookInstance(
      {
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back
      });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, 'title')
        .exec(function (err, books) {
          if (err) { return next(err); }
          // Successful, so render.
          res.render('bookinstance_form', { title: '添加副本', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
        });
      return;
    }
    else {
      // Data from form is valid.
      bookinstance.save(function (err) {
        if (err) { return next(err); }
        // Successful - redirect to new record.
        res.redirect(bookinstance.url);
      });
    }
  }
];

// 由 GET 显示删除书籍副本的表单
exports.bookinstance_delete_get = function (req, res, next) {

  async.parallel({
    bookinstance: function (callback) {
      BookInstance.findById(req.params.id).exec(callback);
    },
  }, function(err, resutls) {
    if(err) { return next(err); }
    if(resutls.bookinstance === null) { //未找到
      res.redirect('/catalog/bookinstances');
    }
    //成功，执行渲染
    res.render('bookinstance_delete', { title: '删除副本', bookinstance: resutls.bookinstance });
  });

};

// 由 POST 处理书籍副本删除操作
exports.bookinstance_delete_post = function(req, res, next) { 
  
  async.parallel({
    bookinstance: function(callback) {
      BookInstance.findById(req.body.bookinstanceid).exec(callback)
    },
  }, function(err, results) {
    if(err) { return next(err); }
    //成功，删除此副本
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookinstance(err) {
      if(err) { return next(err); }
      //成功，路由到Bookinstance List
      res.redirect('/catalog/bookinstances');
    })
  })
};

// 由 GET 显示更新书籍副本的表单
exports.bookinstance_update_get = (req, res) => { res.send('未实现：书籍副本更新表单的 GET'); };

// 由 POST 处理书籍副本更新操作
exports.bookinstance_update_post = (req, res) => { res.send('未实现：更新书籍副本的 POST'); };