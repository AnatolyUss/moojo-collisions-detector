The goal here is to develop a library which can detect collisions on a shared resource.</br>
The input is a series of triplets of the form <resource-id, start-time, end-time>.</br>
Here is an example:</br>

<b>"a", 1500, 1600  // Resource "a" is "locked" between time 1500 and time 1600.</b></br>
<b>"a", 1800, 1900  // Resource "a" is "locked" between time 1800 and time 1900.</b></br>
<b>"b", 1700, 3000  // Resource "b" is "locked" between time 1700 and time 3000.</b></br>

<h3>The library should support these operations:</h3>

    compute the first collision on a given resource ID (or return a value that indicates "no collision")

    given a point in time (t) and resource ID, determine whether the resource is "locked" or "free" at time t.

    given a point in time (t) and resource ID, determine whether the resource has a collision at time t.

    find all collisions on a given resource ID

<h3>Guidelines</h3>
1.</br>
It can be assumed that all data can fit in memory. Persistency is not needed.</br>
2.</br>
There are no hard constraints on the efficiency of the solution.</br>
In general, anything below O(n^3) is acceptable (time complexity).</br>
The algorithm does *not* need to be memory efficient.</br>
3.</br>
Part of the exercise is designing an API for the library.</br>
In particular the input example given above is not binding.</br>
You can decide, for instance, that the input will be given in JSON format, as a CSV file of N lines,</br>
or as a series of N calls to a method which takes three parameters.</br>
Exact decision is up to you.</br>
4.</br>
You need to provide both the implementation of the library + unit tests (using your favorite testing framework)</br>
<h3>By and large, we will look at:</h3>
1. Correctness of the implementation</br>
2. Testing coverage</br> 
3. API of the library</br>
4. Readability of the code (implementation and tests)</br>
