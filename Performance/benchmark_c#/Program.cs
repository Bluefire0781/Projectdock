using System;
using System.Diagnostics;

class Program
{
    static void Main()
    {
        var sw = Stopwatch.StartNew();

        long sum = 0;
        for (int i = 0; i < 1_000_000_000; i++)
            sum += i;

        sw.Stop();
        Console.WriteLine(sum);
        Console.WriteLine(sw.Elapsed);
    }
}
