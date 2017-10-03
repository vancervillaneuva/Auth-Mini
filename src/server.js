const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');

const Post = require('./post.js');

const STATUS_USER_ERROR = 422;

const server = express();
// to enable parsing of json bodies for post requests
server.use(bodyParser.json());


server.use(session({
	secret: 'ksfalkdsjflkasdjfvklasjdflkajdsfksldflkasdjflsdaj' 
})); // long random string



const sendUserError = (err, res) => {
  res.status(STATUS_USER_ERROR);
  if (typeof err === 'string') {
    res.json({ error: err });
  } else {
    res.json(err);
  }
};

const queryAndThen = (query, res, cb) => {
  query.exec((err, result) => {
    if (err) {
      sendUserError(err, res);
    } else {
      cb(result);
    }
  });
};


const findSoID = (req, res, next) => {
  queryAndThen(Post.findOne({ soID: req.params.soID }), res, (post) => {
    if (!post) {
      res.status(STATUS_USER_ERROR);
      res.json({ error: 'Couldn\'t find post with given ID' });
      return;
    }
    req.post = post;
    next();
  });
};

server.get('/accepted-answer/:soID', findSoID, (req, res) => {
  // queryAndThen(Post.findOne({ soID: req.params.soID }), res, (post) => {
  //   if (!post) {
  //     sendUserError("Couldn't find post with given ID", res);
  //     return;
  //   }

    const query = Post.findOne({ soID: post.acceptedAnswerID });
    queryAndThen(query, res, (answer) => {
      if (!answer) {
        sendUserError('No accepted answer', res);
      } else {
        res.json(answer);
      }
    });
  // });
});

server.get('/top-answer/:soID', findSoID, (req, res) => {
  // queryAndThen(Post.findOne({ soID: req.params.soID }), res, (post) => {
  //   if (!post) {
  //     sendUserError("Couldn't find post with given ID", res);
  //     return;
  //   }

    const query = Post
      .findOne({
        soID: { $ne: post.acceptedAnswerID },
        parentID: post.soID,
      })
      .sort({ score: 'desc' });

    queryAndThen(query, res, (answer) => {
      if (!answer) {
        sendUserError('No top answer', res);
      } else {
        res.json(answer);
      }
    });
  // });
});

server.get('/popular-jquery-questions', (req, res) => {
  const query = Post.find({
    parentID: null,
    tags: 'jquery',
    $or: [
      { score: { $gt: 5000 } },
      { 'user.reputation': { $gt: 200000 } }
    ]
  });

  queryAndThen(query, res, posts => res.json(posts));
});

server.get('/npm-answers', (req, res) => {
  const query = Post.find({
    parentID: null,
    tags: 'npm'
  });

  queryAndThen(query, res, (posts) => {
    const answerQuery = Post.find({
      parentID: { $in: posts.map(p => p.soID) }
    });
    queryAndThen(answerQuery, res, answers => res.json(answers));
  });
});

module.exports = { server };
