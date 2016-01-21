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
     
     //sh 'docker inspect ' + app_container.id + ' > container-info.txt 2>&1'
     //def text = readFile('container-info.txt')
     //echo 'exitCode = ' + getContainerExitCode(text)

     def exitCode = 'docker inspect ' + app_container.id + ''.execute().exitValue()
     echo 'exit code = ' + exitCode

     input "How does test look?"
     app_container.stop()
   }
}

@NonCPS
def getContainerExitCode(String text) {
     //return new JsonSlurper().parseText(text).State.ExitCode
}

public class ContainerInfo {

}

