"use client";

import { type FC, type HTMLAttributes, type ReactNode, type SVGProps, useId, useState } from "react";
import {
    ArrowRight,
    ChartBreakoutSquare,
    CheckCircle,
    CreditCardRefresh,
    File05,
    Heart,
    Mail01,
    MessageChatCircle,
    SlashCircle01,
    SwitchHorizontal01,
    Zap,
} from "@untitledui/icons";
import { motion } from "motion/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { AppStoreButton, GooglePlayButton } from "@/components/base/buttons/app-store-buttons";
import { Button } from "@/components/base/buttons/button";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { Header } from "@/components/marketing/header-navigation/header";
import { IPhoneMockup } from "@/components/shared-assets/iphone-mockup";
import { SectionDivider } from "@/components/shared-assets/section-divider";
import { cx } from "@/utils/cx";

const FlowPattern = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg viewBox="0 0 298 408" fill="none" {...props} className={cx("hidden w-48.5 text-fg-quaternary opacity-30 md:block md:w-74.5", props.className)}>
            <g>
                <line x1="203.24" y1="12.7244" x2="207.5" y2="1.01986" stroke="currentColor" strokeWidth="2" />
                <line x1="229.864" y1="12.1777" x2="236.092" y2="1.39079" stroke="currentColor" strokeWidth="2" />
                <line x1="256.656" y1="11.6453" x2="264.662" y2="2.10368" stroke="currentColor" strokeWidth="2" />
                <line x1="283.65" y1="10.7437" x2="293.192" y2="2.73735" stroke="currentColor" strokeWidth="2" />
                <line x1="17.7088" y1="12.2758" x2="8.16716" y2="4.26944" stroke="currentColor" strokeWidth="2" />
                <line x1="44.4605" y1="12.9309" x2="36.4542" y2="3.38926" stroke="currentColor" strokeWidth="2" />
                <line x1="71.0519" y1="13.1777" x2="64.8241" y2="2.39079" stroke="currentColor" strokeWidth="2" />
                <line x1="97.5291" y1="13.4084" x2="93.269" y2="1.7039" stroke="currentColor" strokeWidth="2" />
                <line x1="123.937" y1="13.6297" x2="121.774" y2="1.36324" stroke="currentColor" strokeWidth="2" />
                <line x1="150.324" y1="13.4561" x2="150.324" y2="1.00036" stroke="currentColor" strokeWidth="2" />
                <line x1="176.742" y1="13.2824" x2="178.905" y2="1.01594" stroke="currentColor" strokeWidth="2" />
                <line x1="175.217" y1="34.5222" x2="179.477" y2="22.8177" stroke="currentColor" strokeWidth="2" />
                <line x1="201.837" y1="33.9746" x2="208.065" y2="23.1877" stroke="currentColor" strokeWidth="2" />
                <line x1="228.628" y1="33.4431" x2="236.635" y2="23.9015" stroke="currentColor" strokeWidth="2" />
                <line x1="255.627" y1="32.5416" x2="265.168" y2="24.5352" stroke="currentColor" strokeWidth="2" />
                <line x1="282.859" y1="31.2736" x2="293.646" y2="25.0458" stroke="currentColor" strokeWidth="2" />
                <line x1="16.4371" y1="34.7287" x2="8.43071" y2="25.1871" stroke="currentColor" strokeWidth="2" />
                <line x1="43.0285" y1="34.9746" x2="36.8007" y2="24.1877" stroke="currentColor" strokeWidth="2" />
                <line x1="69.5017" y1="35.2063" x2="65.2416" y2="23.5018" stroke="currentColor" strokeWidth="2" />
                <line x1="95.9097" y1="35.4266" x2="93.7468" y2="23.1601" stroke="currentColor" strokeWidth="2" />
                <line x1="122.297" y1="35.2529" x2="122.297" y2="22.7972" stroke="currentColor" strokeWidth="2" />
                <line x1="148.718" y1="35.0793" x2="150.881" y2="22.8128" stroke="currentColor" strokeWidth="2" />
                <line x1="147.189" y1="56.3201" x2="151.449" y2="44.6156" stroke="currentColor" strokeWidth="2" />
                <line x1="173.814" y1="55.7725" x2="180.042" y2="44.9855" stroke="currentColor" strokeWidth="2" />
                <line x1="200.605" y1="55.24" x2="208.611" y2="45.6984" stroke="currentColor" strokeWidth="2" />
                <line x1="227.603" y1="54.3384" x2="237.145" y2="46.3321" stroke="currentColor" strokeWidth="2" />
                <line x1="254.836" y1="53.0705" x2="265.623" y2="46.8427" stroke="currentColor" strokeWidth="2" />
                <line x1="282.33" y1="52.2185" x2="294.034" y2="47.9584" stroke="currentColor" strokeWidth="2" />
                <line x1="15.0012" y1="56.7725" x2="8.77331" y2="45.9855" stroke="currentColor" strokeWidth="2" />
                <line x1="41.4783" y1="57.0041" x2="37.2182" y2="45.2996" stroke="currentColor" strokeWidth="2" />
                <line x1="67.8863" y1="57.2244" x2="65.7234" y2="44.958" stroke="currentColor" strokeWidth="2" />
                <line x1="94.2734" y1="57.0508" x2="94.2734" y2="44.5951" stroke="currentColor" strokeWidth="2" />
                <line x1="120.691" y1="56.8771" x2="122.854" y2="44.6107" stroke="currentColor" strokeWidth="2" />
                <line x1="119.166" y1="78.117" x2="123.426" y2="66.4124" stroke="currentColor" strokeWidth="2" />
                <line x1="145.786" y1="77.5703" x2="152.014" y2="66.7834" stroke="currentColor" strokeWidth="2" />
                <line x1="172.578" y1="77.0379" x2="180.584" y2="67.4963" stroke="currentColor" strokeWidth="2" />
                <line x1="199.576" y1="76.1363" x2="209.118" y2="68.1299" stroke="currentColor" strokeWidth="2" />
                <line x1="226.812" y1="74.8683" x2="237.599" y2="68.6405" stroke="currentColor" strokeWidth="2" />
                <line x1="254.306" y1="74.0164" x2="266.011" y2="69.7563" stroke="currentColor" strokeWidth="2" />
                <line x1="282.08" y1="72.8033" x2="294.347" y2="70.6404" stroke="currentColor" strokeWidth="2" />
                <line x1="13.4509" y1="78.801" x2="9.19083" y2="67.0965" stroke="currentColor" strokeWidth="2" />
                <line x1="39.8589" y1="79.0223" x2="37.696" y2="66.7558" stroke="currentColor" strokeWidth="2" />
                <line x1="66.2461" y1="78.8486" x2="66.2461" y2="66.3929" stroke="currentColor" strokeWidth="2" />
                <line x1="92.6675" y1="78.675" x2="94.8304" y2="66.4085" stroke="currentColor" strokeWidth="2" />
                <line x1="91.1384" y1="99.9148" x2="95.3985" y2="88.2103" stroke="currentColor" strokeWidth="2" />
                <line x1="117.763" y1="99.3672" x2="123.991" y2="88.5802" stroke="currentColor" strokeWidth="2" />
                <line x1="144.554" y1="98.8357" x2="152.561" y2="89.2941" stroke="currentColor" strokeWidth="2" />
                <line x1="171.553" y1="97.9332" x2="181.094" y2="89.9268" stroke="currentColor" strokeWidth="2" />
                <line x1="198.785" y1="96.6662" x2="209.572" y2="90.4384" stroke="currentColor" strokeWidth="2" />
                <line x1="226.279" y1="95.8132" x2="237.984" y2="91.5531" stroke="currentColor" strokeWidth="2" />
                <line x1="254.053" y1="94.6011" x2="266.319" y2="92.4382" stroke="currentColor" strokeWidth="2" />
                <line x1="11.8355" y1="100.819" x2="9.6726" y2="88.5527" stroke="currentColor" strokeWidth="2" />
                <line x1="38.2227" y1="100.646" x2="38.2227" y2="88.1898" stroke="currentColor" strokeWidth="2" />
                <line x1="64.6402" y1="100.472" x2="66.8031" y2="88.2054" stroke="currentColor" strokeWidth="2" />
                <line x1="297.68" y1="95.418" x2="285.224" y2="95.418" stroke="currentColor" strokeWidth="2" />
                <line x1="63.115" y1="121.712" x2="67.3751" y2="110.007" stroke="currentColor" strokeWidth="2" />
                <line x1="89.7355" y1="121.165" x2="95.9634" y2="110.378" stroke="currentColor" strokeWidth="2" />
                <line x1="116.527" y1="120.633" x2="124.533" y2="111.091" stroke="currentColor" strokeWidth="2" />
                <line x1="143.525" y1="119.731" x2="153.067" y2="111.725" stroke="currentColor" strokeWidth="2" />
                <line x1="170.762" y1="118.463" x2="181.549" y2="112.235" stroke="currentColor" strokeWidth="2" />
                <line x1="198.256" y1="117.611" x2="209.96" y2="113.351" stroke="currentColor" strokeWidth="2" />
                <line x1="226.029" y1="116.398" x2="238.296" y2="114.235" stroke="currentColor" strokeWidth="2" />
                <line x1="10.1953" y1="122.443" x2="10.1953" y2="109.988" stroke="currentColor" strokeWidth="2" />
                <line x1="36.6168" y1="122.27" x2="38.7797" y2="110.003" stroke="currentColor" strokeWidth="2" />
                <line x1="269.652" y1="117.216" x2="257.197" y2="117.216" stroke="currentColor" strokeWidth="2" />
                <line x1="297.365" y1="118.368" x2="285.099" y2="116.205" stroke="currentColor" strokeWidth="2" />
                <line x1="35.0877" y1="143.51" x2="39.3478" y2="131.805" stroke="currentColor" strokeWidth="2" />
                <line x1="61.7121" y1="142.962" x2="67.9399" y2="132.175" stroke="currentColor" strokeWidth="2" />
                <line x1="88.5035" y1="142.43" x2="96.5099" y2="132.889" stroke="currentColor" strokeWidth="2" />
                <line x1="115.502" y1="141.529" x2="125.043" y2="133.523" stroke="currentColor" strokeWidth="2" />
                <line x1="142.734" y1="140.261" x2="153.521" y2="134.033" stroke="currentColor" strokeWidth="2" />
                <line x1="170.228" y1="139.409" x2="181.933" y2="135.149" stroke="currentColor" strokeWidth="2" />
                <line x1="198.002" y1="138.196" x2="210.269" y2="136.033" stroke="currentColor" strokeWidth="2" />
                <line x1="8.58941" y1="144.068" x2="10.7523" y2="131.801" stroke="currentColor" strokeWidth="2" />
                <line x1="241.629" y1="139.013" x2="229.173" y2="139.013" stroke="currentColor" strokeWidth="2" />
                <line x1="269.338" y1="140.165" x2="257.072" y2="138.003" stroke="currentColor" strokeWidth="2" />
                <line x1="296.775" y1="141.288" x2="285.071" y2="137.028" stroke="currentColor" strokeWidth="2" />
                <line x1="7.06421" y1="165.307" x2="11.3243" y2="153.603" stroke="currentColor" strokeWidth="2" />
                <line x1="33.6848" y1="164.76" x2="39.9126" y2="153.973" stroke="currentColor" strokeWidth="2" />
                <line x1="60.4761" y1="164.227" x2="68.4825" y2="154.686" stroke="currentColor" strokeWidth="2" />
                <line x1="87.4744" y1="163.326" x2="97.016" y2="155.319" stroke="currentColor" strokeWidth="2" />
                <line x1="114.711" y1="162.058" x2="125.498" y2="155.83" stroke="currentColor" strokeWidth="2" />
                <line x1="142.205" y1="161.206" x2="153.909" y2="156.946" stroke="currentColor" strokeWidth="2" />
                <line x1="169.979" y1="159.994" x2="182.245" y2="157.831" stroke="currentColor" strokeWidth="2" />
                <line x1="295.93" y1="163.79" x2="285.143" y2="157.562" stroke="currentColor" strokeWidth="2" />
                <line x1="213.605" y1="160.811" x2="201.15" y2="160.811" stroke="currentColor" strokeWidth="2" />
                <line x1="241.315" y1="161.963" x2="229.048" y2="159.8" stroke="currentColor" strokeWidth="2" />
                <line x1="268.748" y1="163.085" x2="257.043" y2="158.825" stroke="currentColor" strokeWidth="2" />
                <line x1="5.66132" y1="186.558" x2="11.8892" y2="175.771" stroke="currentColor" strokeWidth="2" />
                <line x1="32.4527" y1="186.025" x2="40.4591" y2="176.484" stroke="currentColor" strokeWidth="2" />
                <line x1="59.451" y1="185.124" x2="68.9926" y2="177.117" stroke="currentColor" strokeWidth="2" />
                <line x1="86.6836" y1="183.856" x2="97.4705" y2="177.628" stroke="currentColor" strokeWidth="2" />
                <line x1="114.178" y1="183.004" x2="125.882" y2="178.744" stroke="currentColor" strokeWidth="2" />
                <line x1="141.951" y1="181.791" x2="154.218" y2="179.628" stroke="currentColor" strokeWidth="2" />
                <line x1="267.902" y1="185.588" x2="257.115" y2="179.36" stroke="currentColor" strokeWidth="2" />
                <line x1="294.853" y1="186.656" x2="285.312" y2="178.649" stroke="currentColor" strokeWidth="2" />
                <line x1="185.578" y1="182.607" x2="173.122" y2="182.607" stroke="currentColor" strokeWidth="2" />
                <line x1="213.287" y1="183.76" x2="201.021" y2="181.597" stroke="currentColor" strokeWidth="2" />
                <line x1="240.724" y1="184.883" x2="229.02" y2="180.623" stroke="currentColor" strokeWidth="2" />
                <line x1="4.42536" y1="207.823" x2="12.4317" y2="198.281" stroke="currentColor" strokeWidth="2" />
                <line x1="31.4236" y1="206.92" x2="40.9652" y2="198.914" stroke="currentColor" strokeWidth="2" />
                <line x1="58.6602" y1="205.654" x2="69.4471" y2="199.426" stroke="currentColor" strokeWidth="2" />
                <line x1="86.1541" y1="204.802" x2="97.8586" y2="200.541" stroke="currentColor" strokeWidth="2" />
                <line x1="113.928" y1="203.588" x2="126.194" y2="201.426" stroke="currentColor" strokeWidth="2" />
                <line x1="239.879" y1="207.386" x2="229.092" y2="201.158" stroke="currentColor" strokeWidth="2" />
                <line x1="266.826" y1="208.453" x2="257.284" y2="200.446" stroke="currentColor" strokeWidth="2" />
                <line x1="293.578" y1="209.109" x2="285.571" y2="199.567" stroke="currentColor" strokeWidth="2" />
                <line x1="157.555" y1="204.405" x2="145.099" y2="204.405" stroke="currentColor" strokeWidth="2" />
                <line x1="185.264" y1="205.558" x2="172.997" y2="203.395" stroke="currentColor" strokeWidth="2" />
                <line x1="212.701" y1="206.681" x2="200.996" y2="202.421" stroke="currentColor" strokeWidth="2" />
                <line x1="3.40018" y1="228.718" x2="12.9418" y2="220.712" stroke="currentColor" strokeWidth="2" />
                <line x1="30.6328" y1="227.45" x2="41.4198" y2="221.223" stroke="currentColor" strokeWidth="2" />
                <line x1="58.1267" y1="226.598" x2="69.8313" y2="222.338" stroke="currentColor" strokeWidth="2" />
                <line x1="85.9006" y1="225.385" x2="98.167" y2="223.222" stroke="currentColor" strokeWidth="2" />
                <line x1="211.852" y1="229.182" x2="201.065" y2="222.955" stroke="currentColor" strokeWidth="2" />
                <line x1="238.803" y1="230.25" x2="229.261" y2="222.244" stroke="currentColor" strokeWidth="2" />
                <line x1="265.55" y1="230.905" x2="257.544" y2="221.364" stroke="currentColor" strokeWidth="2" />
                <line x1="292.146" y1="231.152" x2="285.918" y2="220.365" stroke="currentColor" strokeWidth="2" />
                <line x1="129.527" y1="226.203" x2="117.072" y2="226.203" stroke="currentColor" strokeWidth="2" />
                <line x1="157.237" y1="227.355" x2="144.97" y2="225.192" stroke="currentColor" strokeWidth="2" />
                <line x1="184.674" y1="228.478" x2="172.969" y2="224.218" stroke="currentColor" strokeWidth="2" />
                <line x1="2.60938" y1="249.248" x2="13.3963" y2="243.02" stroke="currentColor" strokeWidth="2" />
                <line x1="30.1033" y1="248.396" x2="41.8078" y2="244.136" stroke="currentColor" strokeWidth="2" />
                <line x1="57.8771" y1="247.183" x2="70.1436" y2="245.02" stroke="currentColor" strokeWidth="2" />
                <line x1="183.828" y1="250.98" x2="173.041" y2="244.752" stroke="currentColor" strokeWidth="2" />
                <line x1="210.775" y1="252.048" x2="201.234" y2="244.042" stroke="currentColor" strokeWidth="2" />
                <line x1="237.527" y1="252.703" x2="229.521" y2="243.162" stroke="currentColor" strokeWidth="2" />
                <line x1="264.118" y1="252.949" x2="257.891" y2="242.162" stroke="currentColor" strokeWidth="2" />
                <line x1="290.595" y1="253.181" x2="286.335" y2="241.476" stroke="currentColor" strokeWidth="2" />
                <line x1="101.504" y1="248" x2="89.0482" y2="248" stroke="currentColor" strokeWidth="2" />
                <line x1="129.213" y1="249.153" x2="116.947" y2="246.99" stroke="currentColor" strokeWidth="2" />
                <line x1="156.65" y1="250.276" x2="144.946" y2="246.016" stroke="currentColor" strokeWidth="2" />
                <line x1="2.07595" y1="270.193" x2="13.7805" y2="265.933" stroke="currentColor" strokeWidth="2" />
                <line x1="29.8498" y1="268.981" x2="42.1163" y2="266.818" stroke="currentColor" strokeWidth="2" />
                <line x1="155.801" y1="272.778" x2="145.014" y2="266.55" stroke="currentColor" strokeWidth="2" />
                <line x1="182.752" y1="273.845" x2="173.21" y2="265.839" stroke="currentColor" strokeWidth="2" />
                <line x1="209.503" y1="274.5" x2="201.497" y2="264.959" stroke="currentColor" strokeWidth="2" />
                <line x1="236.095" y1="274.747" x2="229.867" y2="263.96" stroke="currentColor" strokeWidth="2" />
                <line x1="262.568" y1="274.979" x2="258.308" y2="263.274" stroke="currentColor" strokeWidth="2" />
                <line x1="288.976" y1="275.199" x2="286.813" y2="262.933" stroke="currentColor" strokeWidth="2" />
                <line x1="73.4766" y1="269.798" x2="61.0209" y2="269.798" stroke="currentColor" strokeWidth="2" />
                <line x1="101.186" y1="270.951" x2="88.9193" y2="268.788" stroke="currentColor" strokeWidth="2" />
                <line x1="128.623" y1="272.073" x2="116.918" y2="267.812" stroke="currentColor" strokeWidth="2" />
                <line x1="1.82635" y1="290.778" x2="14.0928" y2="288.615" stroke="currentColor" strokeWidth="2" />
                <line x1="127.777" y1="294.575" x2="116.99" y2="288.347" stroke="currentColor" strokeWidth="2" />
                <line x1="154.724" y1="295.643" x2="145.183" y2="287.637" stroke="currentColor" strokeWidth="2" />
                <line x1="181.476" y1="296.298" x2="173.47" y2="286.756" stroke="currentColor" strokeWidth="2" />
                <line x1="208.068" y1="296.545" x2="201.84" y2="285.758" stroke="currentColor" strokeWidth="2" />
                <line x1="234.545" y1="296.776" x2="230.285" y2="285.071" stroke="currentColor" strokeWidth="2" />
                <line x1="260.953" y1="296.997" x2="258.79" y2="284.73" stroke="currentColor" strokeWidth="2" />
                <line x1="287.34" y1="296.823" x2="287.34" y2="284.368" stroke="currentColor" strokeWidth="2" />
                <line x1="45.4531" y1="291.595" x2="32.9974" y2="291.595" stroke="currentColor" strokeWidth="2" />
                <line x1="73.1623" y1="292.748" x2="60.8958" y2="290.585" stroke="currentColor" strokeWidth="2" />
                <line x1="100.599" y1="293.87" x2="88.8949" y2="289.61" stroke="currentColor" strokeWidth="2" />
                <line x1="99.75" y1="316.373" x2="88.9631" y2="310.145" stroke="currentColor" strokeWidth="2" />
                <line x1="126.701" y1="317.44" x2="117.159" y2="309.434" stroke="currentColor" strokeWidth="2" />
                <line x1="153.453" y1="318.096" x2="145.446" y2="308.554" stroke="currentColor" strokeWidth="2" />
                <line x1="180.044" y1="318.342" x2="173.816" y2="307.555" stroke="currentColor" strokeWidth="2" />
                <line x1="206.517" y1="318.573" x2="202.257" y2="306.869" stroke="currentColor" strokeWidth="2" />
                <line x1="232.925" y1="318.794" x2="230.762" y2="306.527" stroke="currentColor" strokeWidth="2" />
                <line x1="259.312" y1="318.62" x2="259.312" y2="306.164" stroke="currentColor" strokeWidth="2" />
                <line x1="285.734" y1="318.446" x2="287.897" y2="306.18" stroke="currentColor" strokeWidth="2" />
                <line x1="17.4258" y1="313.393" x2="4.97009" y2="313.393" stroke="currentColor" strokeWidth="2" />
                <line x1="45.1349" y1="314.545" x2="32.8685" y2="312.382" stroke="currentColor" strokeWidth="2" />
                <line x1="72.572" y1="315.668" x2="60.8675" y2="311.408" stroke="currentColor" strokeWidth="2" />
                <line x1="284.205" y1="339.686" x2="288.465" y2="327.982" stroke="currentColor" strokeWidth="2" />
                <line x1="71.7266" y1="338.17" x2="60.9396" y2="331.942" stroke="currentColor" strokeWidth="2" />
                <line x1="98.6736" y1="339.238" x2="89.132" y2="331.231" stroke="currentColor" strokeWidth="2" />
                <line x1="125.425" y1="339.893" x2="117.419" y2="330.351" stroke="currentColor" strokeWidth="2" />
                <line x1="152.017" y1="340.14" x2="145.789" y2="329.353" stroke="currentColor" strokeWidth="2" />
                <line x1="178.494" y1="340.37" x2="174.234" y2="328.666" stroke="currentColor" strokeWidth="2" />
                <line x1="204.902" y1="340.592" x2="202.739" y2="328.325" stroke="currentColor" strokeWidth="2" />
                <line x1="231.289" y1="340.418" x2="231.289" y2="327.962" stroke="currentColor" strokeWidth="2" />
                <line x1="257.707" y1="340.244" x2="259.87" y2="327.978" stroke="currentColor" strokeWidth="2" />
                <line x1="17.1115" y1="336.342" x2="4.84504" y2="334.179" stroke="currentColor" strokeWidth="2" />
                <line x1="44.5486" y1="337.465" x2="32.8441" y2="333.205" stroke="currentColor" strokeWidth="2" />
                <line x1="256.181" y1="361.484" x2="260.441" y2="349.78" stroke="currentColor" strokeWidth="2" />
                <line x1="282.802" y1="360.937" x2="289.03" y2="350.15" stroke="currentColor" strokeWidth="2" />
                <line x1="43.6992" y1="359.968" x2="32.9123" y2="353.74" stroke="currentColor" strokeWidth="2" />
                <line x1="70.6502" y1="361.036" x2="61.1086" y2="353.029" stroke="currentColor" strokeWidth="2" />
                <line x1="97.4019" y1="361.691" x2="89.3956" y2="352.149" stroke="currentColor" strokeWidth="2" />
                <line x1="123.993" y1="361.937" x2="117.766" y2="351.15" stroke="currentColor" strokeWidth="2" />
                <line x1="150.467" y1="362.168" x2="146.206" y2="350.464" stroke="currentColor" strokeWidth="2" />
                <line x1="176.875" y1="362.389" x2="174.712" y2="350.123" stroke="currentColor" strokeWidth="2" />
                <line x1="203.262" y1="362.216" x2="203.262" y2="349.76" stroke="currentColor" strokeWidth="2" />
                <line x1="229.683" y1="362.042" x2="231.846" y2="349.776" stroke="currentColor" strokeWidth="2" />
                <line x1="16.5213" y1="359.263" x2="4.81674" y2="355.003" stroke="currentColor" strokeWidth="2" />
                <line x1="228.154" y1="383.282" x2="232.414" y2="371.577" stroke="currentColor" strokeWidth="2" />
                <line x1="254.779" y1="382.734" x2="261.006" y2="371.947" stroke="currentColor" strokeWidth="2" />
                <line x1="281.57" y1="382.202" x2="289.576" y2="372.66" stroke="currentColor" strokeWidth="2" />
                <line x1="15.6758" y1="381.765" x2="4.88883" y2="375.538" stroke="currentColor" strokeWidth="2" />
                <line x1="42.6228" y1="382.832" x2="33.0812" y2="374.826" stroke="currentColor" strokeWidth="2" />
                <line x1="69.3746" y1="383.488" x2="61.3682" y2="373.946" stroke="currentColor" strokeWidth="2" />
                <line x1="95.966" y1="383.734" x2="89.7382" y2="372.947" stroke="currentColor" strokeWidth="2" />
                <line x1="122.443" y1="383.966" x2="118.183" y2="372.262" stroke="currentColor" strokeWidth="2" />
                <line x1="148.851" y1="384.186" x2="146.688" y2="371.92" stroke="currentColor" strokeWidth="2" />
                <line x1="175.238" y1="384.013" x2="175.238" y2="371.557" stroke="currentColor" strokeWidth="2" />
                <line x1="201.656" y1="383.839" x2="203.819" y2="371.573" stroke="currentColor" strokeWidth="2" />
                <line x1="200.131" y1="405.079" x2="204.391" y2="393.374" stroke="currentColor" strokeWidth="2" />
                <line x1="226.751" y1="404.532" x2="232.979" y2="393.745" stroke="currentColor" strokeWidth="2" />
                <line x1="253.543" y1="404" x2="261.549" y2="394.458" stroke="currentColor" strokeWidth="2" />
                <line x1="280.541" y1="403.098" x2="290.082" y2="395.092" stroke="currentColor" strokeWidth="2" />
                <line x1="14.5994" y1="404.63" x2="5.05778" y2="396.624" stroke="currentColor" strokeWidth="2" />
                <line x1="41.3511" y1="405.285" x2="33.3448" y2="395.744" stroke="currentColor" strokeWidth="2" />
                <line x1="67.9426" y1="405.532" x2="61.7147" y2="394.745" stroke="currentColor" strokeWidth="2" />
                <line x1="94.4158" y1="405.763" x2="90.1557" y2="394.058" stroke="currentColor" strokeWidth="2" />
                <line x1="120.824" y1="405.984" x2="118.661" y2="393.718" stroke="currentColor" strokeWidth="2" />
                <line x1="147.211" y1="405.811" x2="147.211" y2="393.355" stroke="currentColor" strokeWidth="2" />
                <line x1="173.632" y1="405.637" x2="175.795" y2="393.37" stroke="currentColor" strokeWidth="2" />
            </g>
        </svg>
    );
};

const LineChart = (props: SVGProps<SVGSVGElement>) => {
    // We need to use a unique ID because there might be
    // multiple instances of this element in the same page.
    const id = useId();

    return (
        <svg width="736" height="341" viewBox="0 0 736 341" fill="none" {...props}>
            <g clipPath={`url(#clip-${id})`}>
                <mask id={`mask-${id}`} style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="46" width="736" height="295">
                    <rect width="736" height="295" transform="translate(0 46)" fill={`url(#gradient-${id})`} />
                </mask>
                <g mask={`url(#mask-${id})`}>
                    <path
                        opacity="0.08"
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M736 88.7129L723.471 96.3009C722.533 96.8686 721.458 97.1687 720.363 97.1687H706.392L700.365 104.005C699.226 105.296 697.586 106.036 695.864 106.036H686.922C685.632 106.709 684.081 107.502 682.648 108.2C681.669 108.678 680.68 109.144 679.844 109.501C679.434 109.677 678.979 109.862 678.54 110.013L678.511 110.023C678.329 110.087 677.611 110.341 676.713 110.435C676.612 110.459 676.46 110.497 676.253 110.553C675.691 110.705 674.935 110.93 674.07 111.198C672.352 111.732 670.399 112.379 669.128 112.811C668.731 112.946 668.32 113.039 667.903 113.089L645.93 115.697L633.327 119.127C632.485 119.356 631.604 119.399 630.744 119.253L609.895 115.706C609.757 115.682 609.62 115.654 609.484 115.621L600.393 113.412L586.531 118.915C585.826 119.194 585.075 119.338 584.317 119.338H568.159C567.296 119.338 566.444 119.152 565.66 118.793L552.825 112.914C550.258 112.479 546.735 111.889 543.663 111.39C541.963 111.114 540.419 110.869 539.258 110.694C538.674 110.606 538.211 110.54 537.884 110.497C537.743 110.478 537.653 110.467 537.604 110.462C537.016 110.433 536.485 110.334 536.293 110.298L536.264 110.293C535.887 110.223 535.458 110.133 535.022 110.035C534.142 109.839 533.053 109.576 531.925 109.294C529.984 108.809 527.822 108.244 526.192 107.81H519.041L499.691 110.409L484.118 112.817L477.544 118.037C476.664 118.736 475.606 119.173 474.489 119.3L451.348 121.924L439.955 124.453L427.745 128.447L415.58 138.381C414.508 139.256 413.168 139.734 411.785 139.734H406.051C405.714 139.734 405.377 139.705 405.045 139.649L389.407 136.988C388.78 136.882 388.175 136.676 387.612 136.379L372.916 128.62L361.273 124.659H354.448C354.06 124.659 353.673 124.621 353.292 124.546L340.723 122.079L322.429 124.602C322.157 124.64 321.883 124.659 321.609 124.659H304.084L286.671 128.891L268.818 134.097L255.518 139.319C255.157 139.46 254.783 139.567 254.402 139.636L239.807 142.297C239.188 142.41 238.556 142.424 237.932 142.341L219.03 139.802L204.292 142.309L188.655 144.969C187.966 145.087 187.261 145.083 186.573 144.957L173.435 142.562L155.041 148.327C154.056 148.636 153.008 148.685 151.998 148.47L136.567 145.189L121.135 148.47C120.724 148.557 120.306 148.601 119.887 148.601H104.189L87.444 151.191C87.1405 151.238 86.834 151.262 86.5269 151.262H69.2524L51.9728 153.856C51.0811 153.989 50.1706 153.921 49.3091 153.654L33.4303 148.742L18.12 151.11L1.94088 156.641C1.29798 156.861 0.64351 156.965 0 156.966V341H736V88.7129ZM676.81 110.413C676.861 110.405 676.888 110.399 676.887 110.398C676.886 110.398 676.878 110.399 676.861 110.402C676.849 110.405 676.832 110.408 676.81 110.413Z"
                        className="fill-utility-brand-600"
                    />
                </g>
                <path
                    d="M0 150.964L16.6799 145.262L33.881 142.601L51.0822 147.922L68.8045 145.262H86.5269L103.728 142.601H119.887L136.567 139.054L153.246 142.601L173.054 136.394L187.649 139.054L203.286 136.394L218.924 133.734L238.731 136.394L253.326 133.734L266.878 128.413L285.122 123.092L303.365 118.659H321.609L340.895 115.998L354.448 118.659H362.266L375.297 123.092L390.414 131.073L406.051 133.734H411.785L424.816 123.092L438.368 118.659L450.357 115.998L473.813 113.338L481.632 107.131L498.833 104.47L518.64 101.81H526.98C530.281 102.697 537.092 104.47 537.926 104.47C538.76 104.47 549.394 106.244 554.606 107.131L568.159 113.338H584.317L599.955 107.131L610.901 109.791L631.751 113.338L644.782 109.791L667.195 107.131C669.802 106.244 675.223 104.47 676.057 104.47C676.891 104.47 682.659 101.514 685.439 100.036H695.864L703.683 91.1687H720.363L736 81.6982"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-utility-brand-600 stroke-[4px] sm:stroke-2"
                />
                <path
                    d="M0 219.949L16.6799 216.317L33.881 214.623L51.0822 218.012L68.8045 216.317H86.5269L103.728 214.623H119.887L136.567 212.363L153.246 214.623L173.054 210.669L187.649 212.363L203.286 210.669L218.924 208.974L238.731 210.669L253.326 208.974L266.878 205.585L285.122 202.196L303.365 199.371H321.609L340.895 197.677L354.448 199.371H362.266L375.297 202.196L390.414 207.279L406.051 208.974H411.785L424.816 202.196L438.368 199.371L450.357 197.677L473.813 195.982L481.632 192.028L498.833 190.334L518.64 188.639H526.98C530.281 189.204 537.092 190.334 537.926 190.334C538.76 190.334 549.394 191.463 554.606 192.028L568.159 195.982H584.317L599.955 192.028L610.901 193.723L631.751 195.982L644.782 193.723L667.195 192.028C669.802 191.463 675.223 190.334 676.057 190.334C676.891 190.334 682.659 188.451 685.439 187.509H695.864L703.683 181.861H720.363L736 175.828"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-utility-brand-400 stroke-[4px] sm:stroke-2"
                />
                <path
                    d="M0 307.255L16.6799 297.605L33.881 293.103L51.0822 302.107L68.8045 297.605H86.5269L103.728 293.103H119.887L136.567 287.1L153.246 293.103L173.054 282.598L187.649 287.1L203.286 282.598L218.924 278.096L238.731 282.598L253.326 278.096L266.878 269.092L285.122 260.088L303.365 252.584H321.609L340.895 248.082L354.448 252.584H362.266L375.297 260.088L390.414 273.594L406.051 278.096H411.785L424.816 260.088L438.368 252.584L450.357 248.082L473.813 243.58L481.632 233.075L498.833 228.573L518.64 224.071H526.98C530.281 225.572 537.092 228.573 537.926 228.573C538.76 228.573 549.394 231.575 554.606 233.075L568.159 243.58H584.317L599.955 233.075L610.901 237.577L631.751 243.58L644.782 237.577L667.195 233.075C669.802 231.575 675.223 228.573 676.057 228.573C676.891 228.573 682.659 223.571 685.439 221.07H695.864L703.683 206.063H720.363L736 190.036"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-utility-brand-700 stroke-[4px] sm:stroke-2"
                />
            </g>
            <defs>
                <linearGradient id={`gradient-${id}`} x1="368" y1="0" x2="368" y2="295" gradientUnits="userSpaceOnUse">
                    <stop />
                    <stop offset="1" stopOpacity="0" />
                </linearGradient>
                <clipPath id={`clip-${id}`}>
                    <rect width="736" height="341" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

const UsersChart = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div
            {...props}
            className={cx(
                "flex h-68 flex-col overflow-hidden rounded-xl bg-primary p-5 shadow-2xl ring-1 ring-secondary_alt md:h-90 md:p-8 lg:h-115",
                props.className,
            )}
        >
            <div className="text-sm font-semibold text-primary md:text-lg">Users over time</div>
            <div className="relative flex min-h-0 min-w-0 flex-1 items-center">
                <div className="absolute inset-0 flex size-full flex-col justify-between py-3">
                    <span className="h-px w-full bg-border-tertiary" />
                    <span className="h-px w-full bg-border-tertiary" />
                    <span className="h-px w-full bg-border-tertiary" />
                    <span className="h-px w-full bg-border-tertiary" />
                    <span className="h-px w-full bg-border-tertiary" />
                    <span className="h-px w-full bg-border-tertiary" />
                </div>
                <LineChart preserveAspectRatio="none" className="relative max-h-full w-full max-w-full" />
            </div>

            <ul className="flex justify-between px-2 md:px-6">
                <li className="text-xs text-tertiary">Jan</li>
                <li className="hidden text-xs text-tertiary md:block">Feb</li>
                <li className="text-xs text-tertiary">Mar</li>
                <li className="hidden text-xs text-tertiary md:block">Apr</li>
                <li className="text-xs text-tertiary">May</li>
                <li className="hidden text-xs text-tertiary md:block">Jun</li>
                <li className="text-xs text-tertiary">Jul</li>
                <li className="hidden text-xs text-tertiary md:block">Aug</li>
                <li className="text-xs text-tertiary">Sep</li>
                <li className="hidden text-xs text-tertiary md:block">Oct</li>
                <li className="text-xs text-tertiary">Nov</li>
                <li className="text-xs text-tertiary">Dec</li>
            </ul>
        </div>
    );
};

const CircleChart = (props: SVGProps<SVGSVGElement>) => {
    const id = useId();

    return (
        <svg width="272" height="272" viewBox="0 0 272 272" fill="none" {...props}>
            <g filter={`url(#filter-${id})`}>
                <rect width="100%" height="100%" rx="136" className="fill-alpha-white/90" />
                <path
                    d="M136 24C150.708 24 165.272 26.897 178.861 32.5255C192.449 38.154 204.796 46.4039 215.196 56.804C225.596 67.2042 233.846 79.551 239.475 93.1395C245.103 106.728 248 121.292 248 136C248 150.708 245.103 165.272 239.474 178.861C233.846 192.449 225.596 204.796 215.196 215.196C204.796 225.596 192.449 233.846 178.861 239.475C165.272 245.103 150.708 248 136 248C121.292 248 106.728 245.103 93.1394 239.474C79.551 233.846 67.2042 225.596 56.804 215.196C46.4038 204.796 38.154 192.449 32.5255 178.86C26.897 165.272 24 150.708 24 136C24 121.292 26.897 106.728 32.5255 93.1394C38.1541 79.5509 46.4039 67.2042 56.8041 56.804C67.2043 46.4038 79.551 38.154 93.1395 32.5255C106.728 26.8969 121.292 24 136 24L136 24Z"
                    className="stroke-utility-gray-100 stroke-[12px] md:stroke-[16px]"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M136 24C161.635 24 186.494 32.7939 206.427 48.9134C226.359 65.0329 240.159 87.5024 245.522 112.57C250.885 137.638 247.486 163.787 235.893 186.65C224.3 209.514 205.214 227.709 181.823 238.197C158.432 248.685 132.15 250.832 107.367 244.278C82.5843 237.725 60.7994 222.868 45.65 202.188C30.5006 181.509 22.9037 156.258 24.1277 130.652C25.3518 105.046 35.3226 80.6356 52.3755 61.4953"
                    className="stroke-utility-brand-700 stroke-[12px] md:stroke-[16px]"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M136 44C148.082 44 160.045 46.3797 171.207 51.0031C182.369 55.6265 192.511 62.4032 201.054 70.9462C209.597 79.4892 216.373 89.6312 220.997 100.793C225.62 111.955 228 123.918 228 136C228 148.082 225.62 160.045 220.997 171.207C216.373 182.369 209.597 192.511 201.054 201.054C192.511 209.597 182.369 216.373 171.207 220.997C160.045 225.62 148.082 228 136 228C123.918 228 111.955 225.62 100.793 220.997C89.6311 216.373 79.4891 209.597 70.9461 201.054C62.4032 192.511 55.6265 182.369 51.0031 171.207C46.3796 160.045 44 148.082 44 136C44 123.918 46.3797 111.955 51.0031 100.793C55.6265 89.6311 62.4032 79.4891 70.9462 70.9461C79.4892 62.4032 89.6312 55.6265 100.793 51.0031C111.955 46.3796 123.918 44 136 44L136 44Z"
                    className="stroke-utility-gray-100 stroke-[12px] md:stroke-[16px]"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M136 44C154.791 44 173.132 49.7544 188.556 60.4892C203.979 71.224 215.746 86.4243 222.272 104.046C228.799 121.668 229.773 140.865 225.064 159.057C220.354 177.249 210.187 193.562 195.929 205.803C181.672 218.044 164.008 225.625 145.313 227.527C126.618 229.43 107.789 225.561 91.3578 216.443C74.9269 207.325 61.6823 193.393 53.4053 176.523C45.1282 159.653 42.2158 140.652 45.0596 122.077"
                    className="stroke-utility-brand-600 stroke-[12px] md:stroke-[16px]"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M136 64C145.455 64 154.818 65.8623 163.553 69.4807C172.289 73.099 180.226 78.4025 186.912 85.0883C193.598 91.7741 198.901 99.7114 202.519 108.447C206.138 117.182 208 126.545 208 136C208 145.455 206.138 154.818 202.519 163.553C198.901 172.289 193.597 180.226 186.912 186.912C180.226 193.598 172.289 198.901 163.553 202.519C154.818 206.138 145.455 208 136 208C126.545 208 117.182 206.138 108.447 202.519C99.7113 198.901 91.7741 193.597 85.0883 186.912C78.4025 180.226 73.099 172.289 69.4807 163.553C65.8623 154.818 64 145.455 64 136C64 126.545 65.8623 117.182 69.4807 108.447C73.099 99.7113 78.4025 91.7741 85.0883 85.0883C91.7742 78.4025 99.7114 73.099 108.447 69.4807C117.182 65.8623 126.545 64 136 64L136 64Z"
                    className="stroke-utility-gray-100 stroke-[12px] md:stroke-[16px]"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M136 64C148.526 64 160.835 67.2678 171.712 73.4807C182.588 79.6936 191.656 88.6365 198.019 99.4261C204.382 110.216 207.82 122.478 207.993 135.003C208.167 147.528 205.069 159.881 199.008 170.843C192.946 181.805 184.129 190.995 173.429 197.507C162.729 204.018 150.514 207.626 137.993 207.972C125.472 208.319 113.077 205.393 102.033 199.484C90.9882 193.575 81.6765 184.886 75.0174 174.277"
                    strokeWidth="16"
                    className="stroke-utility-brand-400 stroke-[12px] md:stroke-[16px]"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
            <defs>
                <filter id={`filter-${id}`} x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                    <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_1303_3405" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_1303_3405" result="shape" />
                </filter>
            </defs>
        </svg>
    );
};

const ActiveUsersChart = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cx("relative flex items-center justify-center", props.className)}>
            <CircleChart className="h-full max-h-full w-full max-w-full" />

            <div className="absolute flex flex-col items-center text-center md:gap-0.5">
                <p className="text-xs font-medium text-tertiary md:text-sm">Active users</p>
                <p className="text-xl font-semibold text-primary md:text-display-xs lg:text-display-sm">1,000</p>
            </div>
        </div>
    );
};

export const HeroColorCard01 = () => {
    return (
        <div className="relative overflow-hidden bg-primary">
            <Header />

            <section className="relative overflow-hidden pb-16 md:pt-8 md:pb-24">
                <div className="absolute top-1/2 left-[-98px] hidden -translate-y-1/2 md:block">
                    <FlowPattern className="text-fg-brand-secondary" />
                </div>
                <div className="absolute right-12 bottom-9 max-md:hidden">
                    <FlowPattern className="text-fg-brand-secondary" />
                </div>

                <div className="mx-auto max-w-container md:px-8">
                    <div className="flex w-full flex-col items-center bg-brand-section px-4 pt-16 pb-24 text-center md:rounded-3xl md:px-8 md:pt-24 md:pb-48">
                        <h1 className="max-w-3xl text-display-md font-semibold text-primary_on-brand md:text-display-lg lg:text-display-2xl">
                            Grow your users. <br />
                            <span className="text-secondary_on-brand">Smarter.</span>
                        </h1>
                        <p className="mt-4 max-w-3xl text-lg text-balance text-tertiary_on-brand md:mt-6 md:text-xl">
                            Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000
                            startups.
                        </p>

                        <Form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = Object.fromEntries(new FormData(e.currentTarget));
                                console.log("Form data:", data);
                            }}
                            className="mt-10 flex w-full flex-col items-stretch gap-4 md:mt-12 md:max-w-120 md:flex-row md:items-start"
                        >
                            <Input
                                isRequired
                                size="md"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                wrapperClassName="py-0.5 not-focus:ring-transparent"
                                hint={
                                    <span className="text-tertiary_on-brand">
                                        We care about your data in our{" "}
                                        <a
                                            href="#"
                                            className="rounded-xs underline underline-offset-3 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                                        >
                                            privacy policy
                                        </a>
                                        .
                                    </span>
                                }
                            />
                            <Button type="submit" size="xl">
                                Get started
                            </Button>
                        </Form>
                    </div>

                    <div className="relative mx-auto -mt-8 w-max max-w-full px-4 md:-mt-24 md:px-8 md:pb-8">
                        <UsersChart />
                        <div className="absolute -right-12 -bottom-10 md:right-[-65px] md:bottom-0">
                            <ActiveUsersChart className="size-[192px] md:size-auto" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

interface TextCentered {
    title: string;
    subtitle: string;
    footer?: ReactNode;
}

interface FeatureTextIntegrationIcon extends TextCentered {
    imgUrl: string;
}

const FeatureTextIntegrationIconTopCentered = ({ imgUrl, title, subtitle, footer }: FeatureTextIntegrationIcon) => (
    <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex size-13 shrink-0 items-center justify-center rounded-lg bg-primary shadow-xs ring-1 ring-secondary ring-inset md:size-16 md:rounded-xl">
            <img alt={title} src={imgUrl} className="size-12 md:size-14" />
        </span>

        <div className="5 flex flex-col items-center gap-4">
            <div>
                <h3 className="text-lg font-semibold text-primary">{title}</h3>
                <p className="mt-1 text-md text-tertiary">{subtitle}</p>
            </div>

            {footer}
        </div>
    </div>
);

const FeaturesIntegrationsIcons03 = () => {
    return (
        <section className="bg-primary py-16 md:pt-0 md:pb-24">
            <div className="mx-auto w-full max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <Badge size="md" type="pill-color" color="brand" className="inline-flex md:hidden">
                        Integrations
                    </Badge>
                    <Badge size="lg" type="pill-color" color="brand" className="hidden md:inline-flex">
                        Integrations
                    </Badge>

                    <h2 className="mt-4 text-display-sm font-semibold text-primary md:text-display-md">Get more value from your tools</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Connect your tools, connect your teams. With over 100 apps already available in our directory, your team's favorite tools are just a
                        click away.
                    </p>
                </div>

                <div className="mt-12 md:mt-16">
                    <ul className="lg:grid-y-16 grid w-full grid-cols-1 justify-items-center gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-16">
                        {[
                            {
                                title: "Notion integration",
                                subtitle: "Work faster and smarter by integrating directly with Notion, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/notion.svg",
                            },
                            {
                                title: "Slack integration",
                                subtitle: "Work faster and smarter by integrating directly with Slack, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/slack.svg",
                            },
                            {
                                title: "Google Drive integration",
                                subtitle: "Work faster and smarter by integrating directly with Google, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/google_drive.svg",
                            },
                            {
                                title: "Intercom integration",
                                subtitle: "Work faster and smarter by integrating directly with Intercom, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/intercom.svg",
                            },
                            {
                                title: "Jira integration",
                                subtitle: "Work faster and smarter by integrating directly with Jira, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/jira.svg",
                            },
                            {
                                title: "Dropbox integration",
                                subtitle: "Work faster and smarter by integrating directly with Dropbox, right in the app.",
                                logo: "https://www.untitledui.com/logos/integrations/dropbox.svg",
                            },
                        ].map((item) => (
                            <li key={item.title}>
                                <FeatureTextIntegrationIconTopCentered
                                    imgUrl={item.logo}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    footer={
                                        <Button color="link-color" size="lg" href="#" iconTrailing={ArrowRight}>
                                            View integration
                                        </Button>
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

const MetricsCardGrayLight = () => {
    return (
        <section className="bg-primary pb-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="flex flex-col gap-8 rounded-2xl bg-secondary px-6 py-10 md:gap-16 md:rounded-none md:bg-transparent md:p-0">
                    <div className="flex w-full flex-col self-center text-center md:max-w-3xl">
                        <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Unleash the full power of data</h2>
                        <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Everything you need to build modern UI and great products.</p>
                    </div>

                    <dl className="flex flex-col gap-8 rounded-2xl bg-secondary md:flex-row md:p-16">
                        {[
                            { title: "400+", subtitle: "Projects completed" },
                            { title: "600%", subtitle: "Return on investment" },
                            { title: "10k", subtitle: "Global downloads" },
                        ].map((item, index) => (
                            <div key={index} className="flex flex-1 flex-col-reverse gap-3 text-center">
                                <dt className="text-lg font-semibold text-primary">{item.subtitle}</dt>
                                <dd className="text-display-lg font-semibold text-brand-tertiary_alt md:text-display-xl">{item.title}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </section>
    );
};

const BlobPattern = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg width="532" height="480" viewBox="0 0 532 480" fill="none" {...props}>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M182.034 461.691C74.9901 428.768 1.32278 329.846 0.0121784 217.408C-1.15817 117.003 82.1936 43.2414 176.777 10.7273C260.07 -17.9056 346.327 12.9156 406.143 77.7959C484.913 163.236 571.343 274.645 512.702 375.097C449.003 484.212 302.448 498.727 182.034 461.691Z"
                className="fill-bg-secondary"
            />
        </svg>
    );
};

interface FeatureTextIcon extends TextCentered {
    icon: FC<{ className?: string }>;
}

const FeatureTextFeaturedIconTopCentered = ({
    color = "gray",
    theme = "modern",
    icon,
    title,
    subtitle,
    footer,
}: FeatureTextIcon & {
    color?: "brand" | "gray" | "success" | "warning" | "error";
    theme?: "light" | "gradient" | "dark" | "outline" | "modern";
}) => (
    <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <FeaturedIcon icon={icon} size="lg" color={color} theme={theme} className="hidden md:inline-flex" />
        <FeaturedIcon icon={icon} size="md" color={color} theme={theme} className="inline-flex md:hidden" />

        <div>
            <h3 className="text-lg font-semibold text-primary">{title}</h3>
            <p className="mt-1 text-md text-tertiary">{subtitle}</p>
        </div>

        {footer}
    </div>
);

const FeaturesCenterMockup02 = () => {
    return (
        <section className="bg-primary py-16 md:pt-0 md:pb-24">
            <div className="mx-auto w-full max-w-container">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center md:px-0">
                    <span className="hidden md:flex">
                        <Badge color="brand" type="pill-color" size="lg">
                            Features
                        </Badge>
                    </span>
                    <span className="flex md:hidden">
                        <Badge color="brand" type="pill-color" size="md">
                            Features
                        </Badge>
                    </span>
                    <h2 className="mt-4 text-display-sm font-semibold text-primary md:text-display-md">Cutting-edge features for advanced analytics</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Powerful, self-serve product and growth analytics to help you convert, engage, and retain more users. Trusted by over 4,000 startups.
                    </p>
                </div>

                <div className="flex flex-col gap-12 md:mt-16 md:gap-24 lg:items-center">
                    <div className="hidden w-auto items-center justify-center md:flex md:h-139.5">
                        {/* Light mode image (hidden in dark mode) */}
                        <img
                            src="https://www.untitledui.com/marketing/screen-mockups/iphone-and-screen-mockup-light-01.webp"
                            className="absolute mt-4 h-154 object-contain dark:hidden"
                            alt="iPhone and desktop screen mockup showing mobile and web application interface"
                        />
                        {/* Dark mode image (hidden in light mode) */}
                        <img
                            src="https://www.untitledui.com/marketing/screen-mockups/iphone-and-screen-mockup-dark-01.webp"
                            className="absolute mt-4 h-154 object-contain not-dark:hidden"
                            alt="iPhone and desktop screen mockup showing mobile and web application interface"
                        />
                    </div>
                    <div className="relative flex h-102 w-full items-center justify-center overflow-hidden pt-12 md:hidden lg:pt-0">
                        <span className="absolute top-20 inline-flex w-105">
                            <BlobPattern />
                        </span>

                        <IPhoneMockup
                            image="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-light-01.webp"
                            imageDark="https://www.untitledui.com/marketing/screen-mockups/dashboard-mobile-mockup-dark-01.webp"
                            className="absolute top-12 w-71 drop-shadow-iphone-mockup"
                        />
                    </div>
                    <ul className="flex flex-1 flex-wrap justify-center gap-x-8 gap-y-10 px-4 md:px-8 lg:flex-nowrap">
                        {[
                            {
                                title: "Share team inboxes",
                                subtitle: "Whether you have a team of 2 or 200, our shared team inboxes keep everyone on the same page and in the loop.",
                                icon: MessageChatCircle,
                                cta: "Learn more",
                                href: "#",
                            },
                            {
                                title: "Deliver instant answers",
                                subtitle: "An all-in-one customer service platform that helps you balance everything your customers need to be happy.",
                                icon: Zap,
                                cta: "Learn more",
                                href: "#",
                            },
                            {
                                title: "Manage your team with reports",
                                subtitle:
                                    "Measure what matters with Untitled's easy-to-use reports. You can filter, export, and drilldown on the data in a couple clicks.",
                                icon: ChartBreakoutSquare,
                                cta: "Learn more",
                                href: "#",
                            },
                        ].map((item) => (
                            <li key={item.title}>
                                <FeatureTextFeaturedIconTopCentered
                                    icon={item.icon}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    footer={
                                        <Button color="link-color" size="lg" href={item.href} iconTrailing={ArrowRight}>
                                            Learn more
                                        </Button>
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

const plans = [
    {
        title: "Basic plan",
        price: 10,
        description: "Our most popular plan for small teams.",
        contentTitle: "FEATURES",
        contentDescription: (
            <>
                Everything in our <span className="text-md font-semibold">free plan</span> plus....
            </>
        ),
        features: [
            "Access to basic features",
            "Basic reporting + analytics",
            "Up to 10 individual users",
            "20 GB individual data",
            "Basic chat support",
            "Attend events",
            "Automatic updates",
            "Backup your account",
            "Audit log and notes",
            "Feature requests",
        ],
    },
    {
        title: "Business plan",
        price: 20,
        description: "Advanced features and reporting.",
        contentTitle: "FEATURES",
        contentDescription: (
            <>
                Everything in our <span className="text-md font-semibold">basic plan</span> plus....
            </>
        ),
        badge: "Popular",
        features: [
            "200+ integrations",
            "Advanced reporting",
            "Up to 20 individual users",
            "40 GB individual data",
            "Priority chat support",
            "Advanced custom fields",
            "Audit log and data history",
            "Backup your account",
            "Personalized service",
            "+ many more...",
        ],
    },
];

const CheckItemText = (props: {
    size?: "sm" | "md" | "lg" | "xl";
    text?: string;
    color?: "primary" | "success";
    iconStyle?: "outlined" | "contained" | "filled";
    textClassName?: string;
}) => {
    const { text, color, size, iconStyle = "contained" } = props;

    return (
        <li className="flex gap-3">
            {iconStyle === "contained" && (
                <div
                    className={cx(
                        "flex shrink-0 items-center justify-center rounded-full",
                        color === "success" ? "bg-success-secondary text-featured-icon-light-fg-success" : "bg-brand-primary text-featured-icon-light-fg-brand",
                        size === "lg" ? "size-7 md:h-8 md:w-8" : size === "md" ? "size-7" : "size-6",
                    )}
                >
                    <svg
                        width={size === "lg" ? 16 : size === "md" ? 15 : 13}
                        height={size === "lg" ? 14 : size === "md" ? 13 : 11}
                        viewBox="0 0 13 11"
                        fill="none"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M11.0964 0.390037L3.93638 7.30004L2.03638 5.27004C1.68638 4.94004 1.13638 4.92004 0.736381 5.20004C0.346381 5.49004 0.236381 6.00004 0.476381 6.41004L2.72638 10.07C2.94638 10.41 3.32638 10.62 3.75638 10.62C4.16638 10.62 4.55638 10.41 4.77638 10.07C5.13638 9.60004 12.0064 1.41004 12.0064 1.41004C12.9064 0.490037 11.8164 -0.319963 11.0964 0.380037V0.390037Z"
                            fill="currentColor"
                        />
                    </svg>
                </div>
            )}

            {iconStyle === "filled" && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1.5 4L4.5 7L10.5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}

            {iconStyle === "outlined" && (
                <CheckCircle
                    className={cx(
                        "shrink-0",
                        color === "success" ? "text-fg-success-primary" : "text-fg-brand-primary",
                        size === "lg" ? "size-7 md:h-8 md:w-8" : size === "md" ? "size-7" : "size-6",
                    )}
                />
            )}

            <span
                className={cx(
                    "text-tertiary",
                    size === "lg" ? "pt-0.5 text-lg md:pt-0" : size === "md" ? "pt-0.5 text-md md:pt-0 md:text-lg" : "text-md",
                    iconStyle === "filled" && "text-brand-secondary",
                    props.textClassName,
                )}
            >
                {text}
            </span>
        </li>
    );
};

const PricingTierCardDualCheckItems = (props: {
    title: string;
    description?: string;
    contentTitle: string;
    contentDescription: ReactNode;
    price?: number;
    badge?: string;
    features: string[];
    className?: string;
}) => {
    return (
        <div className={cx("flex flex-col overflow-hidden rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt", props.className)}>
            <div className="flex flex-col-reverse gap-4 px-6 pt-6 pb-8 md:flex-row md:justify-between md:gap-8 md:px-8 md:pt-8 md:pb-6">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-primary">{props.title}</h2>
                        {props.badge && (
                            <Badge size="md" type="pill-color" color="brand">
                                {props.badge}
                            </Badge>
                        )}
                    </div>
                    <p className="text-md text-tertiary">{props.description}</p>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="-translate-y-[5px] text-display-md font-semibold text-primary md:-translate-y-[15px]">$</span>
                    <span className="text-display-lg font-semibold text-primary md:text-display-xl">{props.price || 10}</span>
                    <span className="text-md font-medium text-tertiary">per month</span>
                </div>
            </div>

            <div className="flex flex-col gap-6 border-t border-secondary px-6 py-8 md:px-8 md:pt-8 md:pb-10">
                <div className="flex flex-col gap-1">
                    <p className="text-md font-semibold text-primary">{props.contentTitle}</p>
                    <p className="text-md text-tertiary">{props.contentDescription}</p>
                </div>
                <ul className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                    {props.features.map((feat) => (
                        <CheckItemText key={feat} color="success" text={feat} />
                    ))}
                </ul>
            </div>

            <div className="mt-auto flex flex-col gap-3 border-t border-secondary px-6 pt-6 pb-8 md:p-8">
                <Button size="xl">Get started</Button>
            </div>
        </div>
    );
};

const PricingSectionSimpleCards04 = () => {
    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <span className="text-sm font-semibold text-brand-secondary md:text-md">Pricing</span>
                    <h2 className="mt-3 text-display-sm font-semibold text-primary md:text-display-md">Plans that fit your scale</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">
                        Simple, transparent pricing that grows with you. Try any plan free for 30 days.
                    </p>
                </div>

                <div className="mx-auto mt-12 grid w-full max-w-xl grid-cols-1 gap-4 md:mt-16 md:gap-8 xl:max-w-none xl:grid-cols-2">
                    {plans.map((plan) => (
                        <PricingTierCardDualCheckItems key={plan.title} {...plan} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const faqsExtended = [
    {
        question: "Is there a free trial available?",
        answer: "Yes, you can try us for free for 30 days. If you want, we'll provide you with a free, personalized 30-minute onboarding call to get you up and running as soon as possible.",
        icon: Heart,
    },
    {
        question: "Can I change my plan later?",
        answer: "Of course. Our pricing scales with your company. Chat to our friendly team to find a solution that works for you.",
        icon: SwitchHorizontal01,
    },
    {
        question: "What is your cancellation policy?",
        answer: "We understand that things change. You can cancel your plan at any time and we'll refund you the difference already paid.",
        icon: SlashCircle01,
    },
    {
        question: "Can other info be added to an invoice?",
        answer: "Yes, you can try us for free for 30 days. If you want, we'll provide you with a free, personalized 30-minute onboarding call to get you up and running as soon as possible.",
        icon: File05,
    },
    {
        question: "How does billing work?",
        answer: "Plans are per workspace, not per account. You can upgrade one workspace, and still have any number of free workspaces.",
        icon: CreditCardRefresh,
    },
    {
        question: "How do I change my account email?",
        answer: "You can change the email address associated with your account by going to untitled.com/account from a laptop or desktop.",
        icon: Mail01,
    },
];

const FAQAccordion01 = () => {
    const [openQuestions, setOpenQuestions] = useState(new Set([0]));

    const handleToggle = (index: number) => {
        openQuestions.has(index) ? openQuestions.delete(index) : openQuestions.add(index);
        setOpenQuestions(new Set(openQuestions));
    };

    return (
        <section className="bg-primary py-16 md:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <h2 className="text-display-sm font-semibold text-primary md:text-display-md">Frequently asked questions</h2>
                    <p className="mt-4 text-lg text-tertiary md:mt-5 md:text-xl">Everything you need to know about the product and billing.</p>
                </div>

                <div className="mx-auto mt-12 max-w-3xl md:mt-16">
                    <div className="flex flex-col gap-8">
                        {faqsExtended.map((faq, index) => (
                            <div key={faq.question} className="not-first:-mt-px not-first:border-t not-first:border-secondary not-first:pt-6">
                                <h3>
                                    <button
                                        onClick={() => handleToggle(index)}
                                        className="flex w-full cursor-pointer items-start justify-between gap-2 rounded-md text-left outline-focus-ring select-none focus-visible:outline-2 focus-visible:outline-offset-2 md:gap-6"
                                    >
                                        <span className="text-md font-semibold text-primary">{faq.question}</span>

                                        <span aria-hidden="true" className="flex size-6 items-center text-fg-quaternary">
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <line
                                                    className={cx(
                                                        "origin-center rotate-0 transition duration-150 ease-out",
                                                        openQuestions.has(index) && "-rotate-90",
                                                    )}
                                                    x1="12"
                                                    y1="8"
                                                    x2="12"
                                                    y2="16"
                                                ></line>
                                                <line x1="8" y1="12" x2="16" y2="12"></line>
                                            </svg>
                                        </span>
                                    </button>
                                </h3>

                                <motion.div
                                    className="overflow-hidden"
                                    initial={false}
                                    animate={{ height: openQuestions.has(index) ? "auto" : 0, opacity: openQuestions.has(index) ? 1 : 0 }}
                                    transition={{ type: "spring", damping: 24, stiffness: 240, bounce: 0.4 }}
                                >
                                    <div className="pt-1 pr-8 md:pr-12">
                                        <p className="text-md text-tertiary">{faq.answer}</p>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center gap-6 rounded-2xl bg-secondary px-6 py-8 text-center md:mt-16 md:gap-8 md:pt-8 md:pb-10">
                    <div className="flex items-end -space-x-4">
                        <Avatar
                            src="https://www.untitledui.com/images/avatars/marco-kelly?fm=webp&q=80"
                            alt="Marco Kelly"
                            size="lg"
                            className="ring-[1.5px] ring-fg-white"
                        />
                        <Avatar
                            src="https://www.untitledui.com/images/avatars/amelie-laurent?fm=webp&q=80"
                            alt="Amelie Laurent"
                            size="xl"
                            className="z-10 ring-[1.5px] ring-fg-white"
                        />
                        <Avatar
                            src="https://www.untitledui.com/images/avatars/jaya-willis?fm=webp&q=80"
                            alt="Jaya Willis"
                            size="lg"
                            className="ring-[1.5px] ring-fg-white"
                        />
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold text-primary">Still have questions?</h4>
                        <p className="mt-2 text-md text-tertiary md:text-lg">Can't find the answer you're looking for? Please chat to our friendly team.</p>
                    </div>
                    <Button size="xl">Get in touch</Button>
                </div>
            </div>
        </section>
    );
};

const SocialProofCard = () => {
    return (
        <section className="bg-primary pb-16 max-md:hidden md:pb-24">
            <div className="mx-auto max-w-container md:px-8">
                <div className="flex flex-col gap-8 bg-secondary px-6 py-12 md:rounded-2xl md:p-16">
                    <p className="text-center text-md font-medium text-tertiary md:text-xl">Trusted by 4,000+ companies</p>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 xl:gap-x-8">
                        {/* Light mode images (hidden in dark mode) */}
                        <img alt="Catalog" src="https://www.untitledui.com/logos/logotype/color/catalog.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Pictelai" src="https://www.untitledui.com/logos/logotype/color/pictelai.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Leapyear" src="https://www.untitledui.com/logos/logotype/color/leapyear.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Peregrin" src="https://www.untitledui.com/logos/logotype/color/peregrin.svg" className="h-9 md:h-12 dark:hidden" />
                        <img alt="Easytax" src="https://www.untitledui.com/logos/logotype/color/easytax.svg" className="h-9 md:h-12 dark:hidden" />
                        <img
                            alt="Coreos"
                            src="https://www.untitledui.com/logos/logotype/color/coreos.svg"
                            className="inline-flex h-9 md:hidden md:h-12 dark:hidden"
                        />

                        {/* Dark mode images (hidden in light mode) */}
                        <img
                            alt="Catalog"
                            src="https://www.untitledui.com/logos/logotype/white/catalog.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Pictelai"
                            src="https://www.untitledui.com/logos/logotype/white/pictelai.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Leapyear"
                            src="https://www.untitledui.com/logos/logotype/white/leapyear.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Peregrin"
                            src="https://www.untitledui.com/logos/logotype/white/peregrin.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Easytax"
                            src="https://www.untitledui.com/logos/logotype/white/easytax.svg"
                            className="h-9 opacity-85 not-dark:hidden md:h-12"
                        />
                        <img
                            alt="Coreos"
                            src="https://www.untitledui.com/logos/logotype/white/coreos.svg"
                            className="inline-flex h-9 opacity-85 not-dark:hidden md:hidden md:h-12"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const footerNavListBrand = [
    {
        label: "Product",
        items: [
            { label: "Overview", href: "#" },
            { label: "Features", href: "#" },
            {
                label: "Solutions",
                href: "#",
                badge: (
                    <Badge type="modern" size="sm" className="ml-1">
                        New
                    </Badge>
                ),
            },
            { label: "Tutorials", href: "#" },
            { label: "Pricing", href: "#" },
            { label: "Releases", href: "#" },
        ],
    },
    {
        label: "Company",
        items: [
            { label: "About us", href: "#" },
            { label: "Careers", href: "#" },
            { label: "Press", href: "#" },
            { label: "News", href: "#" },
            { label: "Media kit", href: "#" },
            { label: "Contact", href: "#" },
        ],
    },
    {
        label: "Resources",
        items: [
            { label: "Blog", href: "#" },
            { label: "Newsletter", href: "#" },
            { label: "Events", href: "#" },
            { label: "Help centre", href: "#" },
            { label: "Tutorials", href: "#" },
            { label: "Support", href: "#" },
        ],
    },
    {
        label: "Social",
        items: [
            { label: "Twitter", href: "#" },
            { label: "LinkedIn", href: "#" },
            { label: "Facebook", href: "#" },
            { label: "GitHub", href: "#" },
            { label: "AngelList", href: "#" },
            { label: "Dribbble", href: "#" },
        ],
    },
    {
        label: "Legal",
        items: [
            { label: "Terms", href: "#" },
            { label: "Privacy", href: "#" },
            { label: "Cookies", href: "#" },
            { label: "Licenses", href: "#" },
            { label: "Settings", href: "#" },
            { label: "Contact", href: "#" },
        ],
    },
];

const FooterLarge03 = () => {
    return (
        <footer className="bg-primary py-12 md:pt-16">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <nav className="flex flex-col-reverse gap-12 md:flex-row md:gap-16">
                    <ul className="grid flex-1 grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
                        {footerNavListBrand.map((category) => (
                            <li key={category.label}>
                                <h4 className="text-sm font-semibold text-primary">{category.label}</h4>
                                <ul className="mt-4 flex flex-col gap-3">
                                    {category.items.map((item) => (
                                        <li key={item.label}>
                                            <Button color="link-color" size="lg" href={item.href} iconTrailing={item.badge} className="gap-1">
                                                {item.label}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                    <div className="w-full md:max-w-[135px]">
                        <h4 className="text-sm font-semibold text-primary">Get the app</h4>
                        <div className="mt-4 flex w-max flex-row gap-4 md:flex-col">
                            <AppStoreButton href="#" className="w-[135px]" />
                            <GooglePlayButton href="#" className="w-[135px]" />
                        </div>
                    </div>
                </nav>
                <div className="mt-12 flex flex-col justify-between gap-6 border-t border-secondary pt-8 md:mt-16 md:flex-row md:items-center">
                    <UntitledLogo className="h-8 w-min" />
                    <p className="text-md text-quaternary">© 2077 Untitled UI. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

const LandingPage03 = () => {
    return (
        <div className="bg-primary">
            <HeroColorCard01 />

            <FeaturesIntegrationsIcons03 />

            <SectionDivider className="max-md:hidden" />

            <MetricsCardGrayLight />

            <FeaturesCenterMockup02 />

            <SectionDivider />

            <PricingSectionSimpleCards04 />

            <SectionDivider />

            <FAQAccordion01 />

            <SocialProofCard />

            <FooterLarge03 />
        </div>
    );
};

export default LandingPage03;
