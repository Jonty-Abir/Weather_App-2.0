// imports internal modules
const http = require("http");
const fs = require("fs");
// imports external modules
const requests = require("requests");
const express = require("express");
const app = express();
const dotenv = require("dotenv");

// for read evn file
dotenv.config();
// for parsing json data
app.use(express.json());
// for uesing form data
app.use(express.urlencoded({ extended: true }));
// for static acid
app.use(express.static(`${__dirname}/public/`));

const myHtml = fs.readFileSync("./views/home.html", "utf-8");
// const backUp = fs.readFileSync("./views/backUp.html", "utf-8");
let cityName = "Howrah";
let getObj;
const date = new Date();
const getYear = date.getFullYear();
const replaceVal = (tempVal, orgVal) => {
  let temperature = tempVal.replace("{%tempVal%}", orgVal.main.temp);
  temperature = temperature.replace("{%tempMin%}", orgVal.main.temp_min);
  temperature = temperature.replace("{%tempMax%}", orgVal.main.temp_max);
  temperature = temperature.replace("{%location%}", orgVal.name);
  temperature = temperature.replace("{%country%}", orgVal.sys.country);
  temperature = temperature.replace("{%tempstatus%}", orgVal.weather[0].main);
  temperature = temperature.replace("{%fulyear%}", getYear);
  temperature = temperature.replace("{%windspeed%}", orgVal.wind.speed);

  return temperature;
};

app.post("/", (req, res) => {
  cityName = req.body.city;
  getObj = req.body.obj;
});
app.get("/notFound", (req, res) => {
  res.send("Your requested content was not found!");
});
app.get("/", async (req, res, next) => {
  try {
    let objData = getObj || { need: "we need a city name" };
    if (objData.main) {
      let editValu;

      editValu = objData.name.replace(/ā/gi, "a");
      requests(
        `https://timezone.abstractapi.com/v1/current_time/?api_key=8ed1f7b04a464b079e44fdae5d76a058&location=${editValu},${objData.sys.country}`
      ).on("data", (chank) => {
        let api2 = JSON.parse(chank);
        let timeZoneLocation = api2.timezone_location;
        requests(
          `https://timezoneapi.io/api/timezone/?${timeZoneLocation}&token=aCXeQRtSyzkKWmUHGmTI`
        ).on("data", (chank) => {
          let api3 = JSON.parse(chank);
          //
          let time = new Date();
          let getTime = time.toLocaleString(objData.timezone, {
            timeZone: `${api2.timezone_location}`,
          });
          let split1 = getTime.split(" ");
          let timeStrArray = split1[1];
          let splitForTime = timeStrArray.split(":");
          let period = split1[2];
          let timeStamp = `${splitForTime[0]}:${splitForTime[1]}:${period}`;

          let finalInnerHtml =
            `${api3.data.datetime.day_abbr} | ${api3.data.datetime.month_abbr}-${api3.data.datetime.day}th | ${timeStamp} `.toLocaleUpperCase();

          //
          let arrData = [objData];
          const realTimeData = arrData
            .map((value) => replaceVal(myHtml, value))
            .join("");
          res.send(
            `${realTimeData} <script>document.getElementById("date").textContent="${finalInnerHtml}"; document.querySelector(".date").textContent="${api3.data.datetime.timeday_gen}"; </script>`
          );
        });
      });
    } else if (objData.need) {
      requests(
        `https://api.openweathermap.org/data/2.5/weather?q=kolkata&units=metric&appid=7fc36c0e2c2b6ee6c50411f9fa9206ce`
      ).on("data", (chunk) => {
        let objData2 = JSON.parse(chunk);
        let arrData2 = [objData2];
        const realTimeData2 = arrData2
          .map((value) => replaceVal(myHtml, value))
          .join("");
        //  let checkHave = arrData2 ? arrData2 : undefined;

        res.send(
          `${realTimeData2}<script>document.querySelector(".date").style.display="none";</script>`
        );
      });
    } else if (objData.cod) {
      requests(
        `https://api.openweathermap.org/data/2.5/weather?q=kolkata&units=metric&appid=7fc36c0e2c2b6ee6c50411f9fa9206ce`
      ).on("data", (chunk) => {
        let objData2 = JSON.parse(chunk);
        let arrData2 = [objData2];
        const realTimeData2 = arrData2
          .map((value) => replaceVal(myHtml, value))
          .join("");
        //  let checkHave = arrData2 ? arrData2 : undefined;

        res.send(
          `${realTimeData2} <script>document.querySelector(".error").style.display="block";document.querySelector(".date").style.display="none";</script>`
        );
      });
    }
  } catch (err) {
    if (err) {
      console.log(err.message);
    }
  }
});

app.get("/abir",(req,res)=>{
  res.status(200).json({msg:"hey i am abir santra"});
});

app.use((req, res) => {
  res.status(404).send("NotFound!");
});

app.use((err, req, res, next) => {
  if (err) {
    console.log(err);
    res.status(505).send("There was a server side problem.");
  }
  next();
});

app.listen(process.env.PORT, () =>
  console.log(`server listening on ${process.env.PORT}`)
);
