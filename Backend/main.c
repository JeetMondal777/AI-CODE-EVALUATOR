#include <stdio.h>
#include <limits.h>

// Utility function to find maximum of two integers
int max(int a, int b) {
    return (a > b) ? a : b;
}

// Utility function to find minimum of two integers
int min(int a, int b) {
    return (a < b) ? a : b;
}

// Function to find the median of two sorted arrays
double findMedianSortedArrays(int* nums1, int m, int* nums2, int n) {
    // Ensure nums1 is the smaller array
    if (m > n) {
        return findMedianSortedArrays(nums2, n, nums1, m);
    }

    int totalLeft = (m + n + 1) / 2;
    int low = 0, high = m;

    while (low <= high) {
        int cut1 = (low + high) / 2;
        int cut2 = totalLeft - cut1;

        int l1 = (cut1 == 0) ? INT_MIN : nums1[cut1 - 1];
        int l2 = (cut2 == 0) ? INT_MIN : nums2[cut2 - 1];
        int r1 = (cut1 == m) ? INT_MAX : nums1[cut1];
        int r2 = (cut2 == n) ? INT_MAX : nums2[cut2];

        if (l1 <= r2 && l2 <= r1) {
            if ((m + n) % 2 == 0) {
                return (max(l1, l2) + min(r1, r2)) / 2.0;
            } else {
                return (double)max(l1, l2);
            }
        } else if (l1 > r2) {
            high = cut1 - 1;
        } else {
            low = cut1 + 1;
        }
    }

    return -1; // Should not reach here
}

int main() {
    int nums1[] = {1, 3};
    int nums2[] = {2};

    int m = sizeof(nums1) / sizeof(nums1[0]);
    int n = sizeof(nums2) / sizeof(nums2[0]);

    double median = findMedianSortedArrays(nums1, m, nums2, n);
    printf("Median is: %.1f\n", median);  // Output: 2.0

    return 0;
}
