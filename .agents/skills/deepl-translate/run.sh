#!/bin/bash
set -euo pipefail

FREE_API_URL="https://api-free.deepl.com"
PRO_API_URL="https://api.deepl.com"
USER_AGENT="madflow-deepl-skill/1.0"

fail() {
    printf 'Error: %s\n' "$1" >&2
    exit 1
}

if ! command -v curl >/dev/null 2>&1; then
    fail "curl is required to use this skill."
fi

require_auth_key() {
    if [ -z "${DEEPL_API_KEY:-}" ]; then
        fail "DEEPL_API_KEY is not set. Export it before using this skill."
    fi
}

base_url() {
    if [ -n "${DEEPL_API_URL:-}" ]; then
        printf '%s' "${DEEPL_API_URL%/}"
        return
    fi

    if [[ "$DEEPL_API_KEY" == *:fx ]]; then
        printf '%s' "$FREE_API_URL"
        return
    fi

    printf '%s' "$PRO_API_URL"
}

normalize_lang() {
    printf '%s' "$1" | tr '[:lower:]' '[:upper:]'
}

join_by_comma() {
    local IFS=,
    printf '%s' "$*"
}

curl_request() {
    local response

    if ! response="$(curl --silent --show-error --write-out $'\n%{http_code}' "$@")"; then
        fail "curl request failed."
    fi

    local status="${response##*$'\n'}"
    local body="${response%$'\n'*}"

    if [[ "$status" != 2* ]]; then
        if [ -n "$body" ]; then
            printf '%s\n' "$body" >&2
        fi
        fail "DeepL API request failed with HTTP $status."
    fi

    printf '%s\n' "$body"
}

main_usage() {
    printf '%s\n' \
        "DeepL translation skill helper" \
        "" \
        "Usage:" \
        "  .opencode/skills/deepl-translate/run.sh translate [options]" \
        "  .opencode/skills/deepl-translate/run.sh languages [--type source|target]" \
        "  .opencode/skills/deepl-translate/run.sh usage"
}

translate_usage() {
    printf '%s\n' \
        "Translate text with DeepL" \
        "" \
        "Required:" \
        "  --target-lang CODE" \
        "" \
        "Input:" \
        "  stdin                       Preferred unless text is hardcoded/trusted" \
        "  --text TEXT                 Repeat for short, trusted text entries" \
        "  shell note                  stdin avoids ! and quoting issues" \
        "" \
        "Optional:" \
        "  --source-lang CODE" \
        "  --formality default|more|less" \
        "  --context TEXT" \
        "  --glossary-id ID            Requires --source-lang" \
        "  --model-type VALUE" \
        "  --tag-handling html|xml" \
        "  --non-splitting-tag TAG     Repeat as needed" \
        "  --splitting-tag TAG         Repeat as needed" \
        "  --ignore-tag TAG            Repeat as needed" \
        "  --show-billed-characters"
}

languages_usage() {
    printf '%s\n' \
        "List DeepL languages" \
        "" \
        "Usage:" \
        "  .opencode/skills/deepl-translate/run.sh languages [--type source|target]"
}

translate() {
    local target_lang=""
    local source_lang=""
    local formality=""
    local context=""
    local glossary_id=""
    local model_type=""
    local tag_handling=""
    local show_billed_characters=0
    local stdin_text=""
    local -a texts=()
    local -a non_splitting_tags=()
    local -a splitting_tags=()
    local -a ignore_tags=()

    while [ $# -gt 0 ]; do
        case "$1" in
            --text)
                [ $# -ge 2 ] || fail "--text requires a value."
                texts+=("$2")
                shift 2
                ;;
            --target-lang)
                [ $# -ge 2 ] || fail "--target-lang requires a value."
                target_lang="$2"
                shift 2
                ;;
            --source-lang)
                [ $# -ge 2 ] || fail "--source-lang requires a value."
                source_lang="$2"
                shift 2
                ;;
            --formality)
                [ $# -ge 2 ] || fail "--formality requires a value."
                formality="$2"
                shift 2
                ;;
            --context)
                [ $# -ge 2 ] || fail "--context requires a value."
                context="$2"
                shift 2
                ;;
            --glossary-id)
                [ $# -ge 2 ] || fail "--glossary-id requires a value."
                glossary_id="$2"
                shift 2
                ;;
            --model-type)
                [ $# -ge 2 ] || fail "--model-type requires a value."
                model_type="$2"
                shift 2
                ;;
            --tag-handling)
                [ $# -ge 2 ] || fail "--tag-handling requires a value."
                tag_handling="$2"
                shift 2
                ;;
            --non-splitting-tag)
                [ $# -ge 2 ] || fail "--non-splitting-tag requires a value."
                non_splitting_tags+=("$2")
                shift 2
                ;;
            --splitting-tag)
                [ $# -ge 2 ] || fail "--splitting-tag requires a value."
                splitting_tags+=("$2")
                shift 2
                ;;
            --ignore-tag)
                [ $# -ge 2 ] || fail "--ignore-tag requires a value."
                ignore_tags+=("$2")
                shift 2
                ;;
            --show-billed-characters)
                show_billed_characters=1
                shift
                ;;
            -h|--help)
                translate_usage
                return 0
                ;;
            *)
                fail "Unknown translate option: $1"
                ;;
        esac
    done

    require_auth_key

    [ -n "$target_lang" ] || fail "--target-lang is required."

    if [ -n "$glossary_id" ] && [ -z "$source_lang" ]; then
        fail "--glossary-id requires --source-lang because DeepL requires source_lang when using a glossary."
    fi

    if [ ${#texts[@]} -eq 0 ] && [ ! -t 0 ]; then
        stdin_text="$(< /dev/stdin)"
        if [ -n "$stdin_text" ]; then
            texts+=("$stdin_text")
        fi
    fi

    [ ${#texts[@]} -gt 0 ] || fail "No text provided. Pass --text or pipe content through stdin."

    local url
    url="$(base_url)/v2/translate"

    local -a curl_args=(
        --request POST
        --url "$url"
        --header "Authorization: DeepL-Auth-Key $DEEPL_API_KEY"
        --header "User-Agent: $USER_AGENT"
        --data-urlencode "target_lang=$(normalize_lang "$target_lang")"
    )

    if [ -n "$source_lang" ]; then
        curl_args+=(--data-urlencode "source_lang=$(normalize_lang "$source_lang")")
    fi
    if [ -n "$formality" ]; then
        curl_args+=(--data-urlencode "formality=$formality")
    fi
    if [ -n "$context" ]; then
        curl_args+=(--data-urlencode "context=$context")
    fi
    if [ -n "$glossary_id" ]; then
        curl_args+=(--data-urlencode "glossary_id=$glossary_id")
    fi
    if [ -n "$model_type" ]; then
        curl_args+=(--data-urlencode "model_type=$model_type")
    fi
    if [ -n "$tag_handling" ]; then
        curl_args+=(--data-urlencode "tag_handling=$tag_handling")
    fi
    if [ ${#non_splitting_tags[@]} -gt 0 ]; then
        curl_args+=(--data-urlencode "non_splitting_tags=$(join_by_comma "${non_splitting_tags[@]}")")
    fi
    if [ ${#splitting_tags[@]} -gt 0 ]; then
        curl_args+=(--data-urlencode "splitting_tags=$(join_by_comma "${splitting_tags[@]}")")
    fi
    if [ ${#ignore_tags[@]} -gt 0 ]; then
        curl_args+=(--data-urlencode "ignore_tags=$(join_by_comma "${ignore_tags[@]}")")
    fi
    if [ "$show_billed_characters" -eq 1 ]; then
        curl_args+=(--data-urlencode "show_billed_characters=1")
    fi

    local text
    for text in "${texts[@]}"; do
        curl_args+=(--data-urlencode "text=$text")
    done

    curl_request "${curl_args[@]}"
}

languages() {
    local type="source"

    while [ $# -gt 0 ]; do
        case "$1" in
            --type)
                [ $# -ge 2 ] || fail "--type requires a value."
                case "$2" in
                    source|target)
                        type="$2"
                        ;;
                    *)
                        fail "--type must be source or target."
                        ;;
                esac
                shift 2
                ;;
            -h|--help)
                languages_usage
                return 0
                ;;
            *)
                fail "Unknown languages option: $1"
                ;;
        esac
    done

    require_auth_key

    curl_request \
        --get \
        --url "$(base_url)/v2/languages" \
        --header "Authorization: DeepL-Auth-Key $DEEPL_API_KEY" \
        --header "User-Agent: $USER_AGENT" \
        --data-urlencode "type=$type"
}

usage() {
    if [ $# -gt 0 ]; then
        case "$1" in
            -h|--help)
                printf '%s\n' \
                    "Show DeepL usage and limits" \
                    "" \
                    "Usage:" \
                    "  .opencode/skills/deepl-translate/run.sh usage"
                return 0
                ;;
            *)
                fail "Unknown usage option: $1"
                ;;
        esac
    fi

    require_auth_key

    curl_request \
        --url "$(base_url)/v2/usage" \
        --header "Authorization: DeepL-Auth-Key $DEEPL_API_KEY" \
        --header "User-Agent: $USER_AGENT"
}

main() {
    local command="${1:-}"

    case "$command" in
        translate)
            shift
            translate "$@"
            ;;
        languages)
            shift
            languages "$@"
            ;;
        usage)
            shift
            usage "$@"
            ;;
        help|-h|--help)
            main_usage
            ;;
        "")
            main_usage
            exit 1
            ;;
        *)
            fail "Unknown command: $command"
            ;;
    esac
}

main "$@"
