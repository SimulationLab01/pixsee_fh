class VitalResultPrinter {
  static STRESS_INDEX_NONE = "si_none";
  static STRESS_INDEX_LOW = "si_low";
  static STRESS_INDEX_NORMAL = "si_normal";
  static STRESS_INDEX_MILD = "si_mild";
  static STRESS_INDEX_HIGH = "si_high";
  static STRESS_INDEX_VERY_HIGH = "si_very_high";

  constructor({ hr_id, hrv_id, sbp_id, dbp_id, rr_id, spo2_id, si_id }) {
    this._hr_element = $("#" + hr_id);
    this._hrv_element = $("#" + hrv_id);
    this._sbp_element = $("#" + sbp_id);
    this._dbp_element = $("#" + dbp_id);
    this._rr_element = $("#" + rr_id);
    this._spo2_element = $("#" + spo2_id);
    this._si_name_element = $("#" + si_id);

    this._last_hr = -1;
    this._last_hrv = -1;
    this._last_sbp = -1;
    this._last_dbp = -1;
    this._last_rr = -1;
    this._last_spo2 = -1;
    this._last_si = -1;
  }

  reset() {
    let default_value = "--";

    this._setValidColor(this._hr_element, true);
    this._setValidColor(this._sbp_element, true);
    this._setValidColor(this._dbp_element, true);
    this._setValidColor(this._rr_element, true);
    this._setValidColor(this._spo2_element, true);

    this._hr_element.text(default_value);
    this._hrv_element.text(default_value);
    this._sbp_element.text(default_value);
    this._dbp_element.text(default_value);
    this._rr_element.text(default_value);
    this._spo2_element.text(default_value);
    this._si_name_element.text(default_value);

    this._last_hr = -1;
    this._last_hrv = -1;
    this._last_sbp = -1;
    this._last_dbp = -1;
    this._last_rr = -1;
    this._last_spo2 = -1;
    this._last_si = -1;
  }

  update({ hr, hrv, sbp, dbp, rr, spo2, si, hr_valid, bp_valid, rr_valid, spo2_valid }) {
    if (hr > 0 && this._last_hr != hr) {
      this._last_hr = hr;
      this._hr_element.text(Math.round(hr));
      this._setValidColor(this._hr_element, hr_valid);
    }
    if (hrv > 0 && this._last_hrv != hrv) {
      this._last_hrv = hrv;
      this._hrv_element.text(Math.round(hrv));
    }
    if (sbp > 0 && this._last_sbp != sbp) {
      this._last_sbp = sbp;
      this._sbp_element.text(Math.round(sbp));
      this._setValidColor(this._sbp_element, bp_valid);
      this._setValidColor(this._dbp_element, bp_valid);
    }
    if (dbp > 0 && this._last_dbp != dbp) {
      this._last_dbp = dbp;
      this._dbp_element.text("/" + Math.round(dbp));
      this._setValidColor(this._dbp_element, bp_valid);
      this._setValidColor(this._sbp_element, bp_valid);
    }
    if (rr > 0 && this._last_rr != rr) {
      this._last_rr = rr;
      this._rr_element.text(Math.round(rr));
      this._setValidColor(this._rr_element, rr_valid);
    }
    if (spo2 > 0 && this._last_spo2 != spo2) {
      this._last_spo2 = spo2;
      this._spo2_element.text(Math.round(spo2));
      this._setValidColor(this._spo2_element, spo2_valid);
    }

    if (si != null && this._last_si != si) {
      this._last_si = si;
      if (si < 0) {
        this._si_name_element.text("---");
      } else if (si < 50) {
        this._si_name_element.text("Low");
      } else if (si < 200) {
        this._si_name_element.text("Normal");
      } else if (si < 350) {
        this._si_name_element.text("Mild");
      } else if (si < 500) {
        this._si_name_element.text("High");
      } else {
        this._si_name_element.text("Very High");
      }

    }
  }

  _setValidColor(element, toggle) {
    if (typeof toggle == "boolean" && toggle) {
      //element.removeClass("text-dark");
      //element.addClass("text-success");
    }
    else {
      //element.removeClass("text-success");
      //element.addClass("text-dark");
    }
  }
}
