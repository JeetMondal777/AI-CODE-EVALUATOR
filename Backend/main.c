#include <stdio.h>
#include <stdlib.h>

#define TABLE_SIZE 1000

typedef struct Node {
    int key;
    int value;
    struct Node* next;
} Node;

typedef struct {
    Node* table[TABLE_SIZE];
} HashMap;

int hash(int key) {
    return abs(key) % TABLE_SIZE;
}

void insert(HashMap* map, int key, int value) {
    int h = hash(key);
    Node* newNode = malloc(sizeof(Node));
    newNode->key = key;
    newNode->value = value;
    newNode->next = map->table[h];
    map->table[h] = newNode;
}

int find(HashMap* map, int key) {
    int h = hash(key);
    Node* current = map->table[h];
    while (current) {
        if (current->key == key) return current->value;
        current = current->next;
    }
    return -1;
}

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 2;
    int* result = malloc(2 * sizeof(int));
    HashMap map = {0};

    for (int i = 0; i < numsSize; i++) {
        int complement = target - nums[i];
        int index = find(&map, complement);
        if (index != -1) {
            result[0] = index;
            result[1] = i;
            return result;
        }
        insert(&map, nums[i], i);
    }

    *returnSize = 0;
    return NULL;
}

int main() {
    int nums[] = {3, 2, 4};
    int target = 6;
    int returnSize;
    int* result = twoSum(nums, 3, target, &returnSize);

    if (result != NULL) {
        printf("[%d, %d]\n", result[0], result[1]);
        free(result);
    } else {
        printf("No solution found\n");
    }

    return 0;
}