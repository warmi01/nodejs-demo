node {

   def app_image, app_unit_image, app_int_image, app_container, unit_container_id, int_container_id

   checkout scm

   docker.withServer(env.CI_DOCKER_HOST) {
   
      try
      {
        def version = readFile 'src/version.txt' 
        def imagetag = "${version.trim()}.${env.BUILD_ID}"
        def images = ['app': null, 'app_unit': null, 'app_int': null]

        stage 'build docker images'
        buildImages(images, imagetag)

        // Run demo app
        echo 'Running demo app..'
        app_container = images.app.run("-i --name nodejs-demo-${imagetag}")
   
        stage 'run unit tests'
        unit_container_id = runAttached(images.app_unit, "-i --name nodejs-demo-unit-tests-${imagetag}")
        testResults(unit_container_id, 'Unit')

        stage 'run integration tests'
        int_container_id = runAttached(images.app_int, "-i --link nodejs-demo-${imagetag}:demohost --name nodejs-demo-int-tests-${imagetag}")
        testResults(int_container_id, 'Integration')
        
        stage 'publish docker images'
        publishDockerImages(images, imagetag)
      }
      catch (all)
      {
        error 'Pipeline error'
      }
      finally
      {
         cleanup(app_container, unit_container_id, int_container_id)
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

def cleanup(app_container, unit_container_id, int_container_id) {

  parallel "Stop demo app container":
  {
   try {app_container.stop()}
   catch (all) {echo 'Error stopping demo app container'}
  },
  "Stop unit tests container":
  {
   try {docker.script.sh "docker stop ${unit_container_id} && docker rm -f ${unit_container_id}"}
   catch (all) {echo 'Error stopping unit tests container'}
  },
  "Stop integration tests container":
  {
   try {docker.script.sh "docker stop ${int_container_id} && docker rm -f ${int_container_id}"}
   catch (all) {echo 'Error stopping integration tests container'}
  },
  failFast: false
}

def publishDockerImages(images, imagetag) {

   try {
      // temporariy use fully qualified VDR name; shorter ose3vdr1 should be used once devops docker changes made
      echo 'here I go'
      docker.withRegistry('http://ose3vdr1.services.slogvpc4.caplatformdev.com:5000', 'docker-registry-login') {
         echo 'in registry block'
         def values = images.values()
         echo "${values}"
         images.each {
            echo 'got it'
            echo "got it: ${it.key}"
            def name = it.value.imageName()
            echo "pushing ${name}"
            it.value.push(imagetag)
         }
      }
   }
   catch (all) {echo "Failed to tag/push to VDR image"}
}

