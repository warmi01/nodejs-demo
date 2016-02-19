node {

     def images = ['app': null, 'app_unit': null, 'app_int': null]
     def containers = ['app': null, 'app_unit': null, 'app_int': null]

     checkout scm
     
     docker.withServer(env.CI_DOCKER_HOST) {
   
          try
          {
               def version = readFile 'src/version.txt' 
               def imagetag = "${version.trim()}.${env.BUILD_ID}"
               
               stage 'build docker images'
               buildImages(images, imagetag)
               
               // Run demo app
               echo 'Running demo app..'
               containers.app = images.app.run("-i --name nodejs-demo-${imagetag}")
               
               stage 'run unit tests'
               containers.app_unit = runAttached(images.app_unit, "-i --name nodejs-demo-unit-tests-${imagetag}")
               testResults(containers.app_unit, 'Unit')
               
               stage 'run integration tests'
               containers.app_int = runAttached(images.app_int, "-i --link nodejs-demo-${imagetag}:demohost --name nodejs-demo-int-tests-${imagetag}")
               testResults(containers.app_int, 'Integration')
               
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
     images.app = docker.build("nodejs-demo",'src/demo-app')
     images.app.tag("${imagetag}");
     
     parallel "Building Docker unit tests image":
     {
          images.app_unit = docker.build("nodejs-demo-unit-tests:${imagetag}",'src/demo-app-unit-tests')
     },
     "Building Docker integration tests image":
     {
          images.app_int = docker.build("nodejs-demo-int-tests:${imagetag}",'src/demo-app-int-tests')
     },
     failFast: false
     
     echo 'Docker builds for images successful'
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

def testResults(container, stage) {

     docker.script.sh "docker logs ${container} > result.txt 2>&1"
     def result = readFile('result.txt')
     result = result.trim()
     if (result.substring(result.length()-11, result.length()) == 'npm info ok')
     {
          echo "${stage} tests passed"
     }
     else
     {
          error "${stage} tests failed"
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
     "Stop unit tests container":
     {
          try {
               docker.script.sh "docker stop ${containers.app_unit} && docker rm -f ${containers.app_unit}"
               docker.script.sh "docker rmi ${images.app_unit.id}"
          }
          catch (all) {echo 'Error stopping unit tests container'}
     },
     "Stop integration tests container":
     {
          try {
               docker.script.sh "docker stop ${containers.app_int} && docker rm -f ${containers.app_int}"
               docker.script.sh "docker rmi ${images.app_int.id}"
          }
          catch (all) {echo 'Error stopping integration tests container'}
     },
     failFast: false
}

def publishDockerImages(images, imagetag) {

     try {
          // temporariy use fully qualified VDR name; shorter ose3vdr1 should be used once devops docker changes made
          docker.withRegistry('http://ose3vdr1.services.slogvpc4.caplatformdev.com:5000', 'docker-registry-login') {
               
               images.app.push(imagetag)
               images.app_unit.push(imagetag)
               images.app_int(imagetag)
          }
     }
     catch (all) {
          error 'Failed to tag/push to VDR image'
     }
}

