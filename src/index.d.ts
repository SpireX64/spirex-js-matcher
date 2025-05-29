// Package: @spirex/matcher
// Copyright 2025 (c) Artem Sobolenkov
// MIT License
// https://github.com/spirex64

interface IMatcher<Context extends object> {
    resolve(): unknown
}

declare function matcher<Context extends object>(context?: Context): IMatcher<Context>;
