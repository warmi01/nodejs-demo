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
     docker.script.sh "docker logs ${app_container.id} > .logs"
     def logs = readFile('.logs').trim()
     echo logs
     docker.script.sh "docker inspect --format '{{.State.ExitCode}}' ${app_container.id} > .status"
     def status = readFile('.status').trim()
     echo "exitCode = ${status}"

     input "How does test look?"
     app_container.stop()
   }
}

