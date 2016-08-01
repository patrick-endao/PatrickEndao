using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MemCacheBenchmark.Models
{
    public class BenchmarkModel
    {
        public int objIndex { get; set; }
        public int minObjDepth { get; set; }
        public int maxObjDepth { get; set; }
        public int minObjScope { get; set; }
        public int maxObjScope { get; set; }
    }
}