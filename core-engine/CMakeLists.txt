cmake_minimum_required(VERSION 3.16)
project(GIFTCoreEngine VERSION 1.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

# -- Binary output directory ---------------------------------------------------
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/bin)

# -- nlohmann/json (header-only, fetched at configure time) --------------------
include(FetchContent)
FetchContent_Declare(
    nlohmann_json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG        v3.11.3
)
FetchContent_MakeAvailable(nlohmann_json)

# -- Static libraries ----------------------------------------------------------

add_library(risk_engine STATIC src/risk_engine.cpp)
target_include_directories(risk_engine PUBLIC include)

add_library(quant_math STATIC src/quant_math.cpp)
target_include_directories(quant_math PUBLIC include)

add_library(backtester STATIC src/backtester.cpp)
target_include_directories(backtester PUBLIC include)

# -- Main executable -----------------------------------------------------------
add_executable(gift_core src/main.cpp)
target_link_libraries(gift_core PRIVATE
    risk_engine
    quant_math
    backtester
    nlohmann_json::nlohmann_json
)
