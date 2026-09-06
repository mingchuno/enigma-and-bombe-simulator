# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React and TypeScript, explicitly selected by the user. Vite build tooling is an implementation choice. Deployment target undecided.

## Product Purpose

An Enigma and Bombe simulator in the browser, grounded in the algorithm research in docs/research/enigma-and-bombe.md.

## Users

Assumed initial audience: learners exploring historical cryptography. The user has not specified a narrower audience.

## Capabilities and Constraints

First implementation follows the proposed research scope: Enigma I, rotors I–V, B/C reflectors, rings, windows, plugboard, signal trace; Bombe-inspired exact constraint search with known rings and reflector. A search result is a crib-compatible candidate, not a claim of unique key recovery. Physical British Bombe fidelity and M4 are deferred.

## Evidence on Hand

Cited museum descriptions, wiring data, and independent test fixtures in the research note. No supplied branding or image assets.

## Product Principles

Correct stepping and explicit assumptions; inspectable intermediate states; responsive cancellation; accessible controls.
