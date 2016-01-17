node {
   checkout scm

   docker.withRegistry('https://docker.example.com/', 'docker-registry-login') {

     stage 'build'
     def app_image = docker.build('nodejs_demo','.')
     def app_container = app_image.run('-i -p 8081:30000 --name nodejs_demo')

     input "How does integration look?"
     app_container.stop()
   }
}

