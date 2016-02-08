
var request = require('supertest'),
	request = request('http://demohost:3000'); // --link nodejs-demo:demohost

describe('app', function(){

  describe('GET /', function(){
    it('should display Welcome to Express', function(done){
      request.get('/')
      .expect(/<h1>Express<\/h1>/)
      .expect(/<p>Welcome to Express<\/p>/)
      .expect(200, done)
    })
  })

  describe('GET /users', function(){
    it('should display respond with a resource', function(done){
      request.get('/users')
      .expect(/respond with a resource/)
      .expect(200, done)
    })
  })

})
