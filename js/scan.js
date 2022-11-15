// HTML element ID List
// ==============================================================
const VIEW_SCAN_HR = "v_hr";
const VIEW_SCAN_HRV = "v_hrv";
const VIEW_SCAN_SBP = "v_sbp";
const VIEW_SCAN_DBP = "v_dbp";
const VIEW_SCAN_SPO2 = "v_spo2";
const VIEW_SCAN_RR = "v_rr";
const VIEW_SCAN_SI = "v_si";
const VIEW_SCAN_CANVAS_LIVE = "live_canvas";
const VIEW_SCAN_IMAGE_MASK = "scan_live_mask";

const VIEW_SCAN_PROGRESS = "progress_scan";
const VIEW_SCAN_PROGRESS_VALUE = "progress_value";
const VIEW_SCAN_PROGRESS_LEFT = "progress_left";
const VIEW_SCAN_PROGRESS_RIGHT = "progress_right";
const VIEW_SCAN_P_HINT = "scan_p_hint";

const MAX_MEASURING_MILLISECOND = 60000;
const SCAN_HINT_TIMEOUT = 1000;
const FACEHEART_SERVER_URL = "wss://compal.faceheart.com:8001/face_upload";
// ==============================================================

// Scan page
// ==============================================================
let _live_video = null;
let _width = 0;
let _height = 0;
let _has_showed_hint = false;
let _has_started = false;
let _to_stop = true;
let _draw_request_id = 0;
let _progress_request_id = 0;
let _show_scan_hint_request_id = 0;
let _continued_time = 0;
let _scan_spower_chart = null;
let _scan_vital_result_printer = null;
let _is_sdk_initial = false;
let _roi_count = 0;
let _draw_count = 0;
let _last_drawed_time = 0;
let _last_update_progress_time = 0;
let _show_roi_image = false;
let _fh_sdk = null;
let _bio_result = '';
let _fh_sdk_ready = false;

$(window).on("orientationchange", () => {
  if (_fh_sdk) {
    SuspendScan();
    setTimeout(() => {
      alert('The Measurement is canceled. Please keep you device stable.')
    }, 1500);
  }
});

const ShowScanHint = () => {
  if (!_has_showed_hint) {
    _has_showed_hint = true;
    $(`#${VIEW_SCAN_P_HINT}`).show();
    $(`#${VIEW_SCAN_IMAGE_MASK}`).show();
    _show_scan_hint_request_id = setTimeout(StartMeasuring, SCAN_HINT_TIMEOUT);
  }
};

const StartMeasuring = () => {
  if (!_has_started) {
    clearTimeout(_show_scan_hint_request_id);

    _has_started = true;
    $(`#${VIEW_SCAN_P_HINT}`).hide();

    $(`#${VIEW_SCAN_PROGRESS}`).show();
    $(`#${VIEW_SCAN_PROGRESS_VALUE}`).text("0%");
    $(`#${VIEW_SCAN_PROGRESS_LEFT}`).addClass("progress-bar");
    $(`#${VIEW_SCAN_PROGRESS_RIGHT}`).addClass("progress-bar");

    _progress_request_id = requestAnimationFrame(UpdateProgress);
    _to_stop = false;
    _draw_request_id = requestAnimationFrame(DrawResult);
  }
};

const StopMeasuring = () => {
  console.log("stop measuring");
  _to_stop = true;

  sessionStorage.setItem("result", _bio_result);

  clearTimeout(_show_scan_hint_request_id);
  cancelAnimationFrame(_draw_request_id);
  cancelAnimationFrame(_progress_request_id);

  if (_live_video) {
    _live_video.stop();
    _live_video = null;
  }
  if (_fh_sdk) {
    _fh_sdk.stopMeasuring({ to_save: false });
    _fh_sdk = null;
  }

  setTimeout(() => {
    console.log("GoToFinish");
    GoToFinish();
  }, 1000);
};

const DrawResult = (timestamp) => {
  if (timestamp - _last_drawed_time >= 1000) {
    _last_drawed_time = timestamp;
    try {
      let result = JSON.parse(_bio_result);

      _scan_vital_result_printer.update({
        hr: result.hr,
        hrv: result.hrv,
        sbp: result.sbp,
        dbp: result.dbp,
        rr: result.rr,
        spo2: result.spo2,
        si: result.si,
        hr_valid: (result.signal_quality.hr_hrv > 0.7),
        bp_valid: (result.signal_quality.bp > 0.6),
        rr_valid: (result.signal_quality.resp > 0.9),
        spo2_valid: (result.signal_quality.spo2 > 0.9)
      });
    } catch {}
  }
  _draw_request_id = requestAnimationFrame(DrawResult);
};

const UpdateProgress = (timestamp) => {
  let ifi = MAX_MEASURING_MILLISECOND / 100;
  if (timestamp - _last_update_progress_time >= ifi) {
    _last_update_progress_time = timestamp;
    _continued_time += 1;
    $(`#${VIEW_SCAN_PROGRESS_VALUE}`).text(_continued_time + "%");
    if (_continued_time == 100) {
      cancelAnimationFrame(_progress_request_id);
      StopMeasuring();
    }
  }

  if (_continued_time < 100) {
    _progress_request_id = requestAnimationFrame(UpdateProgress);
  }
};


const mask_landscape = new Image();
mask_landscape.src = "images/live_rect_landscape.svg";
const mask_portrait = new Image();
mask_portrait.src = "images/live_rect_portrait.svg";
const onFrameCapture = ({ camera, ctx, sn }) => {
  ShowScanHint();

  let img_ = ctx.getImageData(0, 0, camera.videoWidth, camera.videoHeight);
  if (_width > _height)
    ctx.drawImage(mask_landscape, 0, 0, _width, _height)
  else if (_height > _width)
    ctx.drawImage(mask_portrait, 0, 0, _width, _height)
  if (!_to_stop && _fh_sdk_ready) {
    let return_code = _fh_sdk.estimate({ image: img_, cam: camera })
    if (return_code == -4) {
      new Promise(() => {
        alert("Your internet is not stable. Please change your internet and try again later.");
        SuspendScan();
      })
    }
  }
};

const OpenCamera = () => {
  let live_canvas = $(`#${VIEW_SCAN_CANVAS_LIVE}`)[0];

  console.log("open camera");
  _live_video = new camera({
    canvas_out: live_canvas,
    on_enter_frame: onFrameCapture,
  });
  _live_video
    .open()
    .then(({ width, height, orientation }) => {
      _width = width;
      _height = height;
      _orientation = orientation
      live_canvas.width = width;
      live_canvas.height = height;
    })
    .catch((e) => {
      console.log("Camera failed: ", e.message);
    });

  _fh_sdk = new FHVitalsSDK(FACEHEART_SERVER_URL);
  _fh_sdk.on_open = () => { _fh_sdk_ready = true; };
  _fh_sdk.on_alert = ({ type, value, threshold }) => { 
    console.log(`bio estimator alert: ${type} = ${value} (threshold: ${threshold})`);
    new Promise(() => {
      switch(type) {
        case "brightness":
          alert("Please go to the bright environment and try again.");
          break;
        case "contrast":
          alert("Contrast low and try again.");
          break;
        case "motion":
          alert("Please make your face still and try again.");
          break;
        case "face_loss":
          alert("Please put your face in the center and try again.");
          break;
        default:
          alert("Undefine");
          break;
      }
      SuspendScan();
    });
  };

  _fh_sdk.on_result = result => {
    console.log(result);
    _bio_result = JSON.stringify(result);
  };
  _fh_sdk.on_close = () => {
    console.log("connect close ");
  };
  _fh_sdk.startMeasuring(JSON.parse(sessionStorage.getItem("data")));
};

const InitScan = () => {
  console.log("InitScan() called");
  _scan_vital_result_printer = new VitalResultPrinter({
    hr_id: VIEW_SCAN_HR,
    hrv_id: VIEW_SCAN_HRV,
    sbp_id: VIEW_SCAN_SBP,
    dbp_id: VIEW_SCAN_DBP,
    rr_id: VIEW_SCAN_RR,
    spo2_id: VIEW_SCAN_SPO2,
    si_id: VIEW_SCAN_SI,
  });

  $(`#s_next`).click(() => GoToFinish());
  $(`#s_cancel`).click(() => SuspendScan());
};

const GoToScan = () => {
  _fh_sdk_ready = false;
  _show_roi_image = false;
  _has_showed_hint = false;
  _has_started = false;
  _to_stop = true;
  _draw_request_id = 0;
  _progress_request_id = 0;
  _show_scan_hint_request_id = 0;
  _continued_time = 0;
  _scan_vital_result_printer.reset();
  _bio_result = ''
  let canvas_live = $(`#${VIEW_SCAN_CANVAS_LIVE}`)[0];
  canvas_live
    .getContext("2d")
    .clearRect(0, 0, canvas_live.width, canvas_live.height);

  $(`#${VIEW_SCAN_PROGRESS}`).hide();

  OpenCamera();
  $("#basicinfo").hide();
  $("#scan").show();
  $("#finish").hide();
};

const SuspendScan = () => {
  console.log("stop measuring");
  _to_stop = true;

  clearTimeout(_show_scan_hint_request_id);
  cancelAnimationFrame(_draw_request_id);
  cancelAnimationFrame(_progress_request_id);

  if (_live_video) {
    _live_video.stop();
    _live_video = null;
  }
  if (_fh_sdk) {
    _fh_sdk.stopMeasuring({ to_save: false });
    _fh_sdk = null;
  }

  setTimeout(() => {
    console.log("GoToBasicInfo");
    GoToBasicInfo();
  }, 1000);
};

const GoToBasicInfo = () => {
  window.location.href = "basic_info.html";
};

const GoToFinish = () => {
  window.location.href = "finish.html";
};
// ==============================================================

$(document).ready(() => {
  InitScan();
  GoToScan();
});