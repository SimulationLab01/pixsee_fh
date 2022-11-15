/** @class */
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
     * The callback that invoked when the websocket client disconnects to the server.
     *
     * on_close = (error) => {...}
     */
    this.on_close = null;
    

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
     *        motion         // Image quality score. (range: 0-1), the better score range: > 0.9 (This can be affected by user motion or image noise)
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
     * The callback that invoked when occurring specific situations:
     *   1. result.face_loss                > 600
     *   2. result.image_quality.brightness < 0.7 
     *   3. result.image_quality.contrast   < 0.7 
     *   4. result.image_quality.motion     < 0.9
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

    this._FPS = 30;
    this._FINISH_COUNT = 1800;
    this._IMAGE_PARAM = {
      TYPE: "image/jpeg",
      QUALITY: 0.9
    };
    this._url = url;
    this._canvas = document.createElement("canvas");
    this._is_stopping = false;
    this._ws = null;
    this._info_msg = null;
    this._current_sn = 0;
    this._received_sn = 0;
    this._upload_speed_enough = true;
    this._previous_image = {
      width: -1,
      height: -1
    };

    this._last_result = {
      hr: null,
      hrv: null,
      sbp: null,
      dbp: null,
      spo2: null,
      rr: null,
      si: null,
      activity: null, equilibrium: null, health: null, metabolism: null, relaxation: null, sleep: null,
      frame_id: 0,
      face_loss: 0,
      image_quality: {
        brightness: null,
        contrast: null,
        motion: null
      },
      signal_quality: {
        bp: null,
        hr_hrv: null,
        resp: null,
        spo2: null
      }
    };
  }

  /**
   * @public
   * Send the image to the server for measuring. The images must be the
   * same resolution after starting. If the device changes the orientation, 
   * please call stopMeasuring() and call startMeasuring() to re-measuring.
   *
   * 
   * @param   {Object} image    Image data from the webcam video.
   * @param   {Object} cam      HTML element <video>, The webcam video.
   *
   * @returns {number}  1: success, 
   * @returns {number}  0: enough image
   * @returns {number} -1: stop
   * @returns {number} -2: websocket is not opened
   * @returns {number} -3: image invalid
   * @returns {number} -4: upload speed slow
   */
  estimate({ image, cam }) {
    if (this._is_stopping) { return -1; }
    if (!this._ws) { return -2;}
    if (this._ws.readyState != 1) { return -2; }

    if (this._current_sn - this._last_result.face_loss >= this._FINISH_COUNT) {
      return 0;
    }
    if (!this._isImageValid(image)) {
      return -3;
    }

    if (!this._upload_speed_enough) {
      return -4;
    }

    this._current_sn += 1;
    this._upload_speed_enough = this._isUploadSpeedEnough(this._current_sn, this._received_sn);

    let ts = Date.now();
    let hearde_sz = 4 + 4 + 8 + 4 + 1;
    let dataURL = this._getImageDataUrl(image, cam);
    let buffer = new ArrayBuffer(dataURL.length + hearde_sz);
    let offset = 1;
    var buffer_view = new Uint8Array(buffer);
    buffer_view[0] = 0x02; 
    let dv = new DataView(buffer);
    dv.setInt32(offset, image.width, true);
    offset += 4;
    dv.setInt32(offset, image.height, true);
    offset += 4;
    dv.setFloat64(offset, ts, true);
    offset += 8;
    dv.setInt32(offset, this._received_sn, true);
    offset += 4;

    var enc = new TextEncoder()
    buffer_view.set(enc.encode(dataURL), offset);
    this._ws.send(buffer);
    return 1;
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
  startMeasuring({ height, weight, age, sex, ht }) {
    return new Promise(() => {
      if (!this._ws) {
        this._resetParameters();
        this._info_msg = JSON.stringify({ height: height, weight: weight, age: age, sex: sex, ht: ht });
        try {
          this._ws = new WebSocket(this._url);
          this._ws.onopen = () => {
            this._ws.send(this._info_msg);
            if (this.on_open) { 
              this.on_open();
            }
          };

          this._ws.onclose = () => {
            if (this.on_close) {
              this.on_close();
            }
            this._ws = null;
          };

          this._ws.onerror = e => {
            if (this.on_close) {
              this.on_close(e);
            }
          }

          this._ws.onmessage = event => {
            this._onMessage(event.data);
          };
        }
        catch (e) {
          if (this.on_close) {
            this.on_close(e);
          }
        }
      }
    });
  }

  /**
   * @public
   *
   * Make the server stop the measuring progress.
   */
  stopMeasuring() {
    return new Promise(() => {
      if (!this._ws || this._is_stopping) { return; }
      this._is_stopping = true;

      if (this._ws.readyState == 1) {
        if (this._ws) {
          this._ws.send(JSON.stringify({ to_stop: true, received_sn: this._received_sn }));
        }
      }
      else if (this._ws.readyState == 0) {
        this._ws.close(1000);
      }
    });
  }

  /** @private */
  _onMessage(msg) {
    let js = JSON.parse(msg);

    if ("event" in js) {
      if (js.event == "to_stop") {
        this._is_stopping = true;
        if (this._ws) {
          this._ws.close(1000);
        }
      }
    }
    else {
      if (!this._is_stopping) {
        let is_alert = false;
        this._received_sn = js.frame_id;

        if (js.image_quality.brightness && !is_alert) {
          if (js.image_quality.brightness < this.config.threshold.brightness) {
            console.log(`brightness: ${js.image_quality.brightness} < ${this.config.threshold.brightness}`);
            is_alert = true;
            this._abnormalStopInternal();
            if (this.on_alert) {
              this.on_alert({
                type: "brightness",
                value: js.image_quality.brightness,
                threshold: this.config.threshold.brightness
              });
            }
          }
        }

        if (js.image_quality.contrast && !is_alert) {
          if (js.image_quality.contrast < this.config.threshold.contrast) {
            console.log(`contrast: ${js.image_quality.contrast} < ${this.config.threshold.contrast}`);
            is_alert = true;
            this._abnormalStopInternal();
            if (this.on_alert) {
              this.on_alert({
                type: "contrast",
                value: js.image_quality.contrast,
                threshold: this.config.threshold.contrast
              });
            }
          }
        }

        if (this.config.enable_experiment && js.image_quality.motion && !is_alert) {
          if (js.image_quality.motion < this.config.experiment.threshold.motion) {
            console.log(`motion: ${js.image_quality.motion} < ${this.config.experiment.threshold.motion}`);
            is_alert = true;
            this._abnormalStopInternal();
            if (this.on_alert) {
              this.on_alert({
                type: "motion",
                value: js.image_quality.motion,
                threshold: this.config.experiment.threshold.motion
              });
            }
          }
        }

        if (js.face_loss && !is_alert) {
          if (js.face_loss > this.config.threshold.face_loss) {
            console.log(`face_loss: ${js.face_loss} > ${this.config.threshold.face_loss}`);
            is_alert = true;
            this._abnormalStopInternal();
            if (this.on_alert) {
              this.on_alert({
                type: "face_loss",
                value: js.image_quality.face_loss,
                threshold: this.config.threshold.face_loss
              });
            }
          }
        }
      
        this._last_result = js;
        if (this.on_result) {
          this.on_result(this._last_result);
        }
      }
    }
  }

  /** @private */
  _isUploadSpeedEnough(current_sn, received_sn) {
    let enough = true;
    if ("upload_ack" in this.config) {
      for (const ack of this.config.upload_ack) {
        if (current_sn == this._FPS * ack.second) {
          if (received_sn < this._FPS * ack.second * ack.ratio) {
            enough = false;
            break;
          }    
        }
      }
    }
    return enough;
  }

  /** @private */
  _isImageValid(image) {
    if (this._previous_image.width == -1 || this._previous_image.height == -1) {
      this._previous_image.width = image.width;
      this._previous_image.height = image.height;
    }
    return !(this._previous_image.width != image.width || this._previous_image.height != image.height)
  }

  /** @private */
  _getImageDataUrl(image, camera) {
    const ctx = this._canvas.getContext('2d');
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    //Crop
    let x = 0;
    let y = 0;
    let w = 0;
    let h = 0;
    //land
    if (image.width > image.height) {
      x = image.width / 4;
      y = image.height * 0.1;
      w = image.width / 2;
      h = image.height * 0.9;
      this._canvas.width = w;
      this._canvas.height = h;
    }
    //portrait
    if (image.width < image.height) {
      x = 0;
      y = 0;
      w = image.width;
      h = image.height * 0.75;
      this._canvas.width = w;
      this._canvas.height = h;
    }
    ctx.drawImage(camera, x, y, w, h, 0, 0, w, h);
    return this._canvas.toDataURL(this._IMAGE_PARAM.TYPE, this._IMAGE_PARAM.QUALITY);
  }

  /** @private */
  _resetParameters() {
    this._is_stopping = false;
    this._upload_speed_enough = true;
    this._previous_image_width = -1;
    this._previous_image_height = -1;
    this._info_msg = null;
    this._current_sn = 0;
    this._received_sn = 0;
  }

  /** @private */
  _abnormalStopInternal() {
    if (!this._ws || this._is_stopping) { return; }
    this._is_stopping = true;

    if (this._ws.readyState == 1) {
      if (this._ws) {
        this._ws.send(JSON.stringify({ to_stop: true, to_cancel: true, received_sn: this._received_sn }));
      }
    }
    else if (this._ws.readyState == 0) {
      this._ws.close(1000);
    }
  }
}
