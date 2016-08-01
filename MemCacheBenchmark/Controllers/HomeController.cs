using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MemCacheBenchmark.Models;


namespace MemCacheBenchmark.Controllers
{
    public class HomeController : Controller
    {

        [HttpGet]
        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public ActionResult GenerateTestObject(MemCacheBenchmark.Models.BenchmarkModel objectParameters)
        {
            object generatedObject = generateObject(objectParameters);
            return Json(generatedObject, JsonRequestBehavior.AllowGet);
        }

        public GeneratedObject generateObject(MemCacheBenchmark.Models.BenchmarkModel objectParameters) {
            int objIndex = objectParameters.objIndex;
            int minObjScope = objectParameters.minObjScope;
            int maxObjScope = objectParameters.maxObjScope;
            int minObjDepth = objectParameters.minObjDepth;
            int maxObjDepth = objectParameters.maxObjDepth;
            Random rng = new Random(objIndex);
            int objScope = rng.Next(minObjScope, maxObjScope);
            int objDepth = rng.Next(minObjDepth, maxObjDepth);
            GeneratedObject generatedObject = new GeneratedObject()
            {
                objDepth = objDepth,
                objScope = objScope,
                rng = rng
            };
            generatedObject.populate();
            return generatedObject;
        }


    }

    public class GeneratedObject {
        public int objDepth { get; set; }
        public int objScope { get; set; }
        public Random rng { get; set; }
        public List<object> data;
        
        public void populate(){
            List<object> generatedDataList = new List<object>();
            for (int i = 0; i < objScope; i++){
                object newDataRecord = createDataRecord();
                generatedDataList.Add(newDataRecord);
            }
            data = generatedDataList;
        }

        public object createDataRecord() {
            List<object> generatedDataEntry = new List<object>();
            for (int i = 0; i < objScope; i++) {
                object newDataEntry = generateData();
                generatedDataEntry.Add(newDataEntry);
            }
            return generatedDataEntry;
        }

        public object generateData() {
            int dataType = rng.Next(1, 5);
            switch (dataType){
                case 1:
                    return generateString();
                case 2:
                    return generateNumber();
                case 3:
                    return generateBoolean();
            }
            return generateNull();
        }


        public string generateString() {
            return rng.NextDouble().ToString();
        }

        public int generateNumber() {
            return rng.Next();
        }

        public Boolean generateBoolean() {
            return rng.Next(0, 2) == 1;
        }

        public int? generateNull() {
            return null;
        }

    }
}
