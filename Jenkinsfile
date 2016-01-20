import groovy.json.JsonSlurper

node {
   checkout scm

   docker.withRegistry('https://docker.example.com/', 'docker-registry-login') {

     stage 'build'
     sh 'cp Dockerfile_app Dockerfile'
     def app_image = docker.build('nodejs-demo','.')
     def app_container = app_image.run('-i -p 8082:3000 --name nodejs-demo')

     input "How does app look?"
     app_container.stop()

     stage 'test'
     sh 'cp Dockerfile_test Dockerfile'
     app_image = docker.build('nodejs-demo-test','.')
     app_container = app_image.run('-i -p 8082:3000 --name nodejs-demo-test')
     
     def jsonParser = new JsonSlurper()
     sh 'docker inspect ' + app_container.id + ' > container-info.txt'
     def file = new File('container-info.txt')
     def object = jsonParser.parse(file)
     echo 'exitCode = ' + object[0].State.ExitCode

     input "How does test look?"
     app_container.stop()
   }
}

public class ContainerInfo {

}

