<?php

namespace Database\Seeders;

use App\Models\Exercise;
use Illuminate\Database\Seeder;

/**
 * ExerciseSeeder — Catálogo inicial de ejercicios para demo.
 *
 * 3 ejercicios de dificultad creciente para que la demo
 * tenga variedad. Todos en JavaScript porque el frontend
 * arranca con ese lenguaje (Monaco lo resalta por defecto).
 */
class ExerciseSeeder extends Seeder
{
    public function run(): void
    {
        Exercise::insert([
            [
                'title' => 'Two Sum',
                'statement' => "Dado un arreglo de enteros 'nums' y un entero 'target', devuelve los índices de los dos números que suman target.\n\nEjemplo:\n  nums = [2, 7, 11, 15], target = 9\n  → [0, 1]  (porque nums[0] + nums[1] == 9)\n\nRestricciones:\n  - Cada input tiene EXACTAMENTE una solución.\n  - No puedes usar el mismo elemento dos veces.",
                'difficulty' => 'easy',
                'language' => 'javascript',
                'initial_code' => "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Tu código aquí\n}\n",
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Fibonacci',
                'statement' => "Implementa una función que devuelva el N-ésimo número de la secuencia de Fibonacci.\n\nLa secuencia comienza: 0, 1, 1, 2, 3, 5, 8, 13, 21...\n  - fib(0) = 0\n  - fib(1) = 1\n  - fib(n) = fib(n-1) + fib(n-2)\n\nBonus: optimízala para que corra en O(n) sin recursión.",
                'difficulty' => 'medium',
                'language' => 'javascript',
                'initial_code' => "/**\n * @param {number} n\n * @return {number}\n */\nfunction fib(n) {\n  // Tu código aquí\n}\n",
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Valid Palindrome',
                'statement' => "Dada una cadena 's', determina si es un palíndromo, considerando solo caracteres alfanuméricos e ignorando mayúsculas/minúsculas.\n\nEjemplo 1:\n  s = \"A man, a plan, a canal: Panama\"\n  → true\n\nEjemplo 2:\n  s = \"race a car\"\n  → false\n\nRestricciones:\n  - 1 <= s.length <= 2 * 10^5\n  - s consta de caracteres ASCII imprimibles.",
                'difficulty' => 'hard',
                'language' => 'javascript',
                'initial_code' => "/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isPalindrome(s) {\n  // Tu código aquí\n}\n",
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
