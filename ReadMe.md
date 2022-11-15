# FaceHeart FHVitalSDK_web 1.1.0

## Introduction
This is the web demo that shows how to get the vital signs from the face. 

## Getting started
Please copy the `fh-web-sdk` folder to a local server and using the HTTPS to run the `index.html`.

## File
```
fh-web-sdk
├── css
├── images
├── js
│    ├── fhvitals_sdk.js  // The code that shows how to send image to the server and get the vital signs.
│    ├── camera.js        // The code that shows how to open camera, capture image from the camera.
│    ├── basic_info.js    // The code that shows the basic info page working flow.
│    ├── scan.js          // The code that shows the scan page working flow.
│    └── finish.js        // The code that shows the finish page working flow.
│
├── index.html            // The entrance web page.
├── basic_info.html       // The web UI for inputting the basic personal information.
├── finish.html           // The web UI for showing the vital signs after finishing scanning.
└── scan.html             // The web UI for scanning the face from the camera.
```

## Detail
- Demo working flow and camera control integration: `scan.js`

- SDK module : `fhvitals_sdk.js`
  - FaceHeart server URL: `wss://compal.faceheart.com:8001/face_upload`
```
class FHVitalsSDK {
  /**
   * @constructor
   *
   * @param {string} url    The FaceHeart server URL
   */
  constructor(url) {
    /**
     * @public
     *
     * The callback that invoked when the websocket client connects to the server.
     *
     * on_open = () => {...}
     */
    this.on_open = null;
  
  
    /**
     * @public
     *
     * The callback for getting the vital signs from the server.
     *
     * on_result = { 
     *      hr,              // Current heart rate value. (50-180)
     *      hrv,             // Current heart rate variability value.
     *      sbp,             // Current SBP value. (90-160)
     *      dbp,             // Current DBP value. (50-100)
     *      spo2,            // Current SpO2 value. (90-99)
     *      rr,              // Current respiratory rate value. (0-120)
     *      si,              // Current stress index.
     *      activity,        // Current health index. (0-5)
     *      equilibrium,     // Current health index. (0-5)
     *      health,          // Current health index. (0-5)
     *      metabolism,      // Current health index. (0-5)
     *      relaxation,      // Current health index. (0-5)
     *      sleep,           // Current health index. (0-5)
     *      frame_id,        // The frame count that the server receives during the measurement.
     *      face_loss,       // The frame count that not detected face during the measurement.
     *      image_quality: {
     *        brightness,    // Image quality score. (range: 0-1), the better score range: > 0.7
     *        contrast,      // Image quality score. (range: 0-1), the better score range: > 0.7
     *        motion         // Image quality score. (range: 0-1), the better score range: > 0.9 (This can be affected by user motion or image noise, experiment)
     *      },
     *      signal_quality: {
     *        hr_hrv,        // Signal quality score. (range: 0-1), the better score range: > 0.7
     *        bp,            // Signal quality score. (range: 0-1), the better score range: > 0.6
     *        resp,          // Signal quality score. (range: 0-1), the better score range: > 0.9
     *        spo2           // Signal quality score. (range: 0-1), the better score range: > 0.9
     *      },
     *  }) => {...}
     */
    this.on_result = null;
    
    
    /**
     * @public
     *
     * The callback that invoked when the websocket client disconnects to the server.
     *
     * on_close = (error) => {...}
     */
    this.on_close = null;
    
    
    /**
     * @public
     *
     * The callback that invoked when occurring specific conditions:
     *   1. result.face_loss                > 600
     *   2. result.image_quality.brightness < 0.7 
     *   3. result.image_quality.contrast   < 0.7
     * And then FHVitalsSDK stops measuring internally
     *
     * on_alert = () => {...}
     */
    this.on_alert = null;
    
    /** 
     * @public 
     * 
     * The config for the conditions that stopping measuring forced.
     */
    this.config = {
      enable_experiment: false,
      upload_ack: [
        {
          second: 30,
          ratio: 0.5
        },
        {
          second: 45,
          ratio: 0.7
        }
      ],
      threshold: {
        brightness: 0.7,
        contrast: 0.7,
        face_loss: 600
      },
      experiment: {
        threshold: {
          motion: 0.9
        },
      }
    };
    
    ...
  }


  /**
   * @public
   *
   * Make the server reset internal buffers and start the measuring progress.
   *
   * @param {Integer} height    Height (cm)
   * @param {Integer} weight    Weight (kgw)
   * @param {Integer} age       Age
   * @param {Integer} sex       Sex, 0 (female), 1 (male)
   * @param {Integer} ht        Has hypertension, 0 (No), 1 (Yes)
   */
  startMeasuring({ height, weight, age, sex, ht }) {...}


  /**
   * @public
   *
   * Make the server stop the measuring progress.
   */
  stopMeasuring() {...}

  
  /**
   * @public
   *
   * Send the image to the server for measuring. The images must be the
   * same resolution after starting. If the device changes the orientation, 
   * please call stopMeasuring() and call startMeasuring() to re-measuring.
   *
   * 
   * @param   {Object}  image    Image data from the webcam video
   * @param   {Object}  cam      HTML element <video>, The webcam video
   *
   * @returns {Integer}  1       Success, 
   * @returns {Integer}  0       Enough image
   * @returns {Integer} -1       Stop
   * @returns {Integer} -2       Connection is not opened
   * @returns {Integer} -3       Image invalid
   * @returns {Integer} -4       Upload speed slow, 
   *                             - result.frame_id < 0.5 * input frame count (in 30 sec)
   *                             - result.frame_id < 0.7 * input frame count (in 45 sec) 
   */
  estimate({ image, cam }) {...}
}
```


- The conditions that needs to stop measuring forced.
  In the example, if occur these conditions, the web will show alert with description. 
  
  a. If the network upload speed slow (`estimate()` return -4), need to invoke `stopMeasuing()` by self.
  b. `FHVitalsSDK` invoke `stopMeasuring()` inside.
    1. result.face_loss                > 600
    2. result.image_quality.brightness < 0.7 
    3. result.image_quality.contrast   < 0.7
  
  Please fine-tune the threshold in `FHVitalsSDK.config` according to practical application.
  


- Check the quality of the vital result.
  In the example, if the quality score is bigger than the threshold, the web will show green text. 
  
  1.result.signal_quality.hr_hrv > 0.7 
  2. result.signal_quality.bp    > 0.6 
  3. result.signal_quality.resp  > 0.9 
  4. result.signal_quality.spo2  > 0.9

