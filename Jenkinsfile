node {

     def images = ['app': null, 'app_tests': null]
     def containers = ['app': null, 'app_tests': null]

     checkout scm
     
     docker.withServer(env.CI_DOCKER_HOST) {
   
          try
          {
               def version = docker.script.readFile('src/version.txt').trim() 
               def imagetag = "${version}.${env.BUILD_ID}"
               
               stage 'build docker images'
               buildImages(images, imagetag)
               
               // Run demo app
               echo 'Running demo app..'
               containers.app = images.app.run("-i --name ${env.JOB_NAME}-${imagetag}")
               
               stage 'run integration tests'
               containers.app_tests = runAttached(images.app_tests, "-i --link ${env.JOB_NAME}-${imagetag}:demohost --name ${env.JOB_NAME}-tests-${imagetag}", 'npm run-script int-test')
               testResults(containers.app_tests)
               
               stage 'publish docker images'
               publishDockerImages(images, imagetag)
          }
          catch (all)
          {
               error 'Pipeline error'
          }
          finally
          {
               cleanup(images, containers)
          }    
     }
}

def buildImages(images, imagetag) {

     // Build demo app image first (latest used as test image base)
     images.app = docker.build("${env.JOB_NAME}",'src/demo-app')
     images.app.tag("${imagetag}")
     images.app = docker.image("${env.JOB_NAME}:${imagetag}")
     
     parallel "Building Docker tests image":
     {
          images.app_tests = docker.build("${env.JOB_NAME}-tests:${imagetag}",'src/demo-app-tests')
     },
     failFast: false
     
     echo 'Docker builds for images successful'
}

def runAttached(image, args, command) {

     docker.node {
     
          try {
               docker.script.sh "rm .container"
          }
          catch (all) {} 
          
          docker.script.sh "docker run --cidfile=.container ${args != '' ? args : ''} ${image.id} ${command != '' ? command : ''}"
          def container = docker.script.readFile('.container').trim()
          docker.script.dockerFingerprintRun containerId: container, toolName: docker.script.env.DOCKER_TOOL_NAME
          
          return container
     }
}

def testResults(container) {

     docker.script.sh "docker logs ${container} > result.txt 2>&1"
     def result = docker.script.readFile('result.txt').trim()

     if (result.contains('npm info ok'))
     {
          echo "Integration tests passed"
     }
     else
     {
          error "Integration tests failed"
     }
}

def cleanup(images, containers) {

     parallel "Stop demo app container":
     {
          try {
               containers.app.stop()
               docker.script.sh "docker rmi ${images.app.id}"
          }
          catch (all) {echo 'Error stopping demo app container'}
     },
     "Stop tests container":
     {
          try {
               docker.script.sh "docker stop ${containers.app_tests} && docker rm -f ${containers.app_tests}"
               docker.script.sh "docker rmi ${images.app_tests.id}"
          }
          catch (all) {echo 'Error stopping tests container'}
     },
     failFast: false
}

def publishDockerImages(images, imagetag) {

     try {
          // temporariy use fully qualified VDR name; shorter ose3vdr1 should be used once devops docker changes made
          docker.withRegistry('http://ose3vdr1.services.slogvpc4.caplatformdev.com:5000', 'docker-registry-login') {
               
               images.app.push(imagetag)
               images.app_tests.push(imagetag)
          }
     }
     catch (all) {
          echo 'Failed to tag/push to VDR image'
          error 'Failed to tag/push to VDR image'
     }
}

