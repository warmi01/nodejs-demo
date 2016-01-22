
import org.jenkinsci.plugins.docker.workflow.Docker

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
     //app_container = app_image.run('-i -p 8082:3000 --name nodejs-demo-test')
     //sleep 5
     //docker.script.sh "docker logs ${app_container.id} > .logs 2>&1"
     //def logs = readFile('.logs').trim()
     //echo logs
     //docker.script.sh "docker inspect --format '{{.State.ExitCode}}' ${app_container.id} > .status"
     //def status = readFile('.status').trim()
     //echo "exitCode = ${status}"
     def id = runAttached(app_image, '-i -p 8082:3000 --name nodejs-demo-test')

     input "How does test look?"
     //app_container.stop()
     docker.script.sh "docker stop ${id} && docker rm -f ${id}"
   }

}

def runAttached(image, args) {
   docker.node {
       try {
        docker.script.sh "rm .container"
       }
       catch (all) {} 
       docker.script.sh "docker run --cidfile=.container ${args != '' ? ' ' + args : ''} ${image.id}"
       def container = docker.script.readFile('.container').trim()
       docker.script.dockerFingerprintRun containerId: container, toolName: docker.script.env.DOCKER_TOOL_NAME
       return container
   }
}

