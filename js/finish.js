// HTML element ID List
// ==============================================================
const VIEW_FINISH_HR = "f_v_hr";
const VIEW_FINISH_HRV = "f_v_hrv";
const VIEW_FINISH_SBP = "f_v_sbp";
const VIEW_FINISH_DBP = "f_v_dbp";
const VIEW_FINISH_SPO2 = "f_v_spo2";
const VIEW_FINISH_RR = "f_v_rr";
const VIEW_FINISH_SI = "f_v_si";
const VIEW_FINISH_CANVAS_SP = "f_spower_canvas";
const VIEW_FINISH_ACTIVITY = "f_v_activity";
const VIEW_FINISH_EQUILIBRIUM = "f_v_equilibrium";
const VIEW_FINISH_HEALTH = "f_v_health";
const VIEW_FINISH_METABOLISM = "f_v_metabolism";
const VIEW_FINISH_RELAXATION = "f_v_relaxation";
const VIEW_FINISH_SLEEP = "f_v_sleep";
const VIEW_FINISH_BTN_HOME = "f_eid_btn_home";
const VIEW_BACK_BTN_HOME = "f_back";
const VIEW_FINISH_SP_PREFIX = "images/icon_sp_";
// ==============================================================

// Finish Page
// ==============================================================
let _finish_spower_chart = null;
let _finish_vital_result_printer = null;
const SetSPowerValue = (id, value) => {
  let img = $(`#${id}`);
  img.attr('src', `${VIEW_FINISH_SP_PREFIX}${value}.svg`)
};

const InitFinish = () => {
  _finish_vital_result_printer = new VitalResultPrinter({
    hr_id: VIEW_FINISH_HR,
    hrv_id: VIEW_FINISH_HRV,
    sbp_id: VIEW_FINISH_SBP,
    dbp_id: VIEW_FINISH_DBP,
    rr_id: VIEW_FINISH_RR,
    spo2_id: VIEW_FINISH_SPO2,
    si_id: VIEW_FINISH_SI,
  });
  _finish_spower_chart = new SPowerChart(
    $(`#${VIEW_FINISH_CANVAS_SP}`)[0].getContext("2d")
  );
  $(`#${VIEW_FINISH_BTN_HOME}`).click(() => GoToBasicInfo());
  $(`#${VIEW_BACK_BTN_HOME}`).click(() => GoToBasicInfo());
};

const GoToFinish = () => {
  _finish_spower_chart.reset();
  _finish_vital_result_printer.reset();
  let result = JSON.parse(sessionStorage.getItem("result"));

  SetSPowerValue(VIEW_FINISH_ACTIVITY, result.activity);
  SetSPowerValue(VIEW_FINISH_EQUILIBRIUM, result.equilibrium);
  SetSPowerValue(VIEW_FINISH_HEALTH, result.health);
  SetSPowerValue(VIEW_FINISH_METABOLISM, result.metabolism);
  SetSPowerValue(VIEW_FINISH_RELAXATION, result.relaxation);
  SetSPowerValue(VIEW_FINISH_SLEEP, result.sleep);

  _finish_vital_result_printer.update({
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

  setTimeout(() => {
    _finish_spower_chart.update({
      activity: result.activity,
      equilibrium: result.equilibrium,
      health: result.health,
      metabolism: result.metabolism,
      relaxation: result.relaxation,
      sleep: result.sleep,
    });
  }, 200);
};

const GoToBasicInfo = () => {
  window.location.href = "basic_info.html";
}
// ==============================================================

$(document).ready(() => {
  InitFinish();
  GoToFinish();
});