
var request = require('supertest'),
    // Request URL based on environment variable otherwise localhost
    appUrl = process.env.CI_APP_URL || 'http://localhost:3000',
	request = request(appUrl);

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
