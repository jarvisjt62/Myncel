with open('app/dashboard/DashboardClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old = (
    "        ))}\n"
    "      </nav>\n"
    "\n"
    "      {/* User */}\n"
    "      <div className=\"p-4 border-t border-[#e6ebf1]\">"
)

new = (
    "        ))}\n"
    "\n"
    "        {/* HMI Monitor Link */}\n"
    "        <div className=\"mt-2 pt-2 border-t border-[#e6ebf1]\">\n"
    "          <Link\n"
    "            href={hmiLinkHref}\n"
    "            className=\"w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-[#425466] hover:bg-[#f6f9fc] hover:text-[#0a2540]\"\n"
    "          >\n"
    "            <span className=\"text-[#8898aa]\">\n"
    "              <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
    "                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z\" />\n"
    "              </svg>\n"
    "            </span>\n"
    "            <span className=\"flex-1 text-left\">HMI Monitor</span>\n"
    "            <span className=\"text-[9px] bg-[#635bff]/10 text-[#635bff] px-1.5 py-0.5 rounded-full font-semibold\">Live</span>\n"
    "          </Link>\n"
    "        </div>\n"
    "      </nav>\n"
    "\n"
    "      {/* User */}\n"
    "      <div className=\"p-4 border-t border-[#e6ebf1]\">"
)

if old in content:
    content = content.replace(old, new, 1)
    print("HMI sidebar link added")
else:
    print("NOT FOUND")
    idx = content.find("</nav>")
    while idx != -1:
        print(f"Found </nav> at {idx}: {repr(content[idx-50:idx+100])}")
        idx = content.find("</nav>", idx+1)
        if idx > 0:
            break

with open('app/dashboard/DashboardClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")