import mongoose from 'mongoose';

export function beforeTest((done) {
  function clearDB() {
    let collectionCtr = 0;
    for (var i in mongoose.connection.collections) {
      collectionCtr++;
      mongoose.connection.collections[i].remove(function() {
        if (--collectionCtr === 0)
          return done();
      });
    }
    if (collectionCtr === 0) {
      return done();
    }
  }

  if (mongoose.connection.readyState === 0) {
    mongoose.connect('mongodb://localhost/test', function (err) {
      if (err) {
        throw err;
      }
      return clearDB();
    });
  } else {
    return clearDB();
  }
});

export function afterTest(done => {
  mongoose.disconnect();
  done();
});
