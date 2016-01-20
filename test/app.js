
var request = require('supertest'),
    app = require('../app')

describe('app', function(){

  describe('GET /', function(){
    it('should display Welcome to Express', function(done){
      request(app)
      .get('/')
      .expect(/<h1>Express<\/h1>/)
      .expect(/<p>Welcome to Express<\/p>/)
      .expect(200, done)
    })
  })

  describe('GET /users', function(){
    it('should display respond with a resource', function(done){
      request(app)
      .get('/users')
      .expect(/respond with a resource/)
      .expect(200, done)
    })
  })

})
