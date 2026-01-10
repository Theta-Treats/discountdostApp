#ifndef FORMAT_FIX_H
#define FORMAT_FIX_H

#include <string>
#include <sstream>
#include <iomanip>

// We inject our fix directly into the std namespace
// so that calls to std::format find it.
namespace std {
    template<typename... Args>
    inline std::string format(const std::string& fmt, Args... args) {
        if (fmt == "{}%") {
            std::stringstream ss;
            ss << std::fixed << std::setprecision(2);
            (ss << ... << args);
            std::string s = ss.str();
            size_t last = s.find_last_not_of('0');
            if (last != std::string::npos) s.erase(last + 1);
            if (!s.empty() && s.back() == '.') s.pop_back();
            return s + "%";
        }
        return fmt;
    }

    // Overload for const char* (literal strings)
    template<typename... Args>
    inline std::string format(const char* fmt, Args... args) {
        return std::format(std::string(fmt), args...);
    }
}

#endif