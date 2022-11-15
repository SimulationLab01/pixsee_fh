// HTML element ID List
// ==============================================================
const VIEW_BASICINFO_MALE = "eid_male";
const VIEW_BASICINFO_FEMALE = "eid_female";
const VIEW_BASICINFO_HEIGHT = "eid_height";
const VIEW_BASICINFO_WEIGHT = "eid_weight";
const VIEW_BASICINFO_BIRTH = "eid_birth";
const VIEW_BASICINFO_HT_NO = "eid_hy_no";
const VIEW_BASICINFO_HT_YES = "eid_hy_yes";
const VIEW_BASICINFO_BTN_NEXT = "eid_btn_next";
// ==============================================================


// Basic Info Page
// ==============================================================
let _info_map_value_dict = {
  [VIEW_BASICINFO_MALE]: 1,
  [VIEW_BASICINFO_FEMALE]: 0,
  [VIEW_BASICINFO_HT_NO]: 0,
  [VIEW_BASICINFO_HT_YES]: 1
};

const CheckdUpdate = (self_id, others_id) => {
  if ($(`#${self_id}`)[0].checked) {
    others_id.forEach((element) => {
      if (element != self_id) $(`#${element}`)[0].checked = false;
    });
  } else {
    $(`#${others_id[0]}`)[0].checked = true;
  }
};

const GetSex = () => {
  let sex = null;
  if ($(`#${VIEW_BASICINFO_MALE}`)[0].checked) {
    sex = _info_map_value_dict[VIEW_BASICINFO_MALE];
  } else if ($(`#${VIEW_BASICINFO_FEMALE}`)[0].checked) {
    sex = _info_map_value_dict[VIEW_BASICINFO_FEMALE];
  }
  return sex;
};

const GetHeight = () => {
  return parseInt($(`#${VIEW_BASICINFO_HEIGHT}`).val(), 10);
};

const GetWeight = () => {
  return parseInt($(`#${VIEW_BASICINFO_WEIGHT}`).val(), 10);
};

const GetBirthYear = () => {
  return parseInt($(`#${VIEW_BASICINFO_BIRTH}`).val(), 10);
};

const GetHT = () => {
  let ht = null;
  if ($(`#${VIEW_BASICINFO_HT_NO}`)[0].checked) {
    ht = _info_map_value_dict[VIEW_BASICINFO_HT_NO];
  } else if ($(`#${VIEW_BASICINFO_HT_YES}`)[0].checked) {
    ht = _info_map_value_dict[VIEW_BASICINFO_HT_YES];
  }
  return ht;
};

const GoToNext = () => {
  console.log("GoToNext() called");
  let sex = GetSex();
  let height = GetHeight();
  let weight = GetWeight();
  let birth_year = GetBirthYear();
  let ht = GetHT();

  if (isNaN(height) || isNaN(weight) || isNaN(birth_year)) {
    alert("Pelease input the basic information!");
  } else {
    let data = JSON.stringify({
      height: height,
      weight: weight,
      sex: sex,
      age: new Date().getFullYear() - birth_year,
      ht: ht,
    });
    console.log(data);

    sessionStorage.setItem("data", data);

    window.location.href = "scan.html"
  }
};

const InitBasicInfo = () => {
  console.log("InitBasicInfo() called");

  // Set the group & clicked event of the checkboxes.
  $(`#${VIEW_BASICINFO_MALE}`).click(() =>
    CheckdUpdate("eid_male", ["eid_female"])
  );
  $(`#${VIEW_BASICINFO_FEMALE}`).click(() =>
    CheckdUpdate("eid_female", ["eid_male"])
  );
  $(`#${VIEW_BASICINFO_HT_NO}`).click(() =>
    CheckdUpdate("eid_hy_no", ["eid_hy_yes"])
  );
  $(`#${VIEW_BASICINFO_HT_YES}`).click(() =>
    CheckdUpdate("eid_hy_yes", ["eid_hy_no"])
  );

  // Set the clicked event of the next button.
  $(`#${VIEW_BASICINFO_BTN_NEXT}`).click(GoToNext);
};
// ==============================================================

$(document).ready(() => {
  InitBasicInfo();
});